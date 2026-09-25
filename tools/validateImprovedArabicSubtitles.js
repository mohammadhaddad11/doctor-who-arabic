#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodeData = require('../episodeData');
const { episodes: torchwoodEpisodes } = require('../torchwoodData');

const ROOT = path.resolve(__dirname, '..');
const AR_IMPROVED_DIR = path.join(ROOT, 'ar-improved');
const MAPPING_PATH = path.join(ROOT, 'arabicImprovedSubtitles.json');
const TORCHWOOD_MAPPING_PATH = path.join(ROOT, 'torchwoodArabicSubtitles.json');
const TORCHWOOD_AR_IMPROVED_DIR = path.join(ROOT, 'torchwood-subtitles', 'ar-improved');
const TORCHWOOD_AR_CLEAN_DIR = path.join(ROOT, 'torchwood-subtitles', 'ar-clean');
const LOCAL_ENGLISH_SEARCH_DIRS = [
  path.join(ROOT, '.subtitle-audit-cache', 'english'),
  path.join(ROOT, 'english'),
  path.join(ROOT, 'en')
];

function episodeToCanonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${path.basename(filePath)}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${path.basename(filePath)}: ${error.message}`);
  }
}

function getMappedFilename(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value && typeof value.filename === 'string') {
    return value.filename.trim();
  }

  return null;
}

function parseTimestamp(timecode) {
  const match = String(timecode).match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number(match[4]);
  if (minutes >= 60 || seconds >= 60 || millis >= 1000) {
    return null;
  }

  return (((hours * 60) + minutes) * 60 + seconds) * 1000 + millis;
}

function validateSrt(text, label) {
  const failures = [];
  const normalized = String(text || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    failures.push(`${label}: no subtitle blocks found`);
    return { cueCount: 0, failures };
  }

  let cueCount = 0;
  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    let pointer = 0;
    if (/^\d+$/.test((lines[0] || '').trim())) {
      pointer = 1;
    }

    const timestampLine = (lines[pointer] || '').trim();
    const cuePrefix = `${label}: cue block ${index + 1}`;
    if (!timestampLine) {
      failures.push(`${cuePrefix} is missing a timestamp line`);
      return;
    }

    const stampMatch = timestampLine.match(/^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})(?:\s+.*)?$/);
    if (!stampMatch) {
      failures.push(`${cuePrefix} has invalid timestamp format`);
      return;
    }

    const startMs = parseTimestamp(stampMatch[1]);
    const endMs = parseTimestamp(stampMatch[2]);
    if (startMs === null || endMs === null) {
      failures.push(`${cuePrefix} has invalid timestamp value`);
      return;
    }

    if (endMs <= startMs) {
      failures.push(`${cuePrefix} end time must be greater than start time`);
      return;
    }

    const textLines = lines.slice(pointer + 1).map((line) => line.trim()).filter(Boolean);
    if (!textLines.length) {
      failures.push(`${cuePrefix} has empty subtitle text`);
      return;
    }

    cueCount += 1;
  });

  if (cueCount <= 0) {
    failures.push(`${label}: cue count must be greater than zero`);
  }

  return { cueCount, failures };
}

function getEnglishLocalPath(episode) {
  if (!episode || !episode.subtitleUrl) {
    return null;
  }

  const englishFilename = path.basename(episode.subtitleUrl);
  if (!englishFilename || !/\.srt$/i.test(englishFilename)) {
    return null;
  }

  for (const directory of LOCAL_ENGLISH_SEARCH_DIRS) {
    const filePath = path.join(directory, englishFilename);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function main() {
  const mapping = readJson(MAPPING_PATH);
  const torchwoodMapping = readJson(TORCHWOOD_MAPPING_PATH);
  const failures = [];
  const warnings = [];

  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('arabicImprovedSubtitles.json must be an object keyed by canonical episode ID');
  }

  if (!fs.existsSync(AR_IMPROVED_DIR)) {
    failures.push('Missing required directory: ar-improved/');
  }

  const episodeMap = new Map(episodeData.map((episode) => [episodeToCanonicalId(episode), episode]));

  for (const [canonicalId, mappingValue] of Object.entries(mapping)) {
    const filename = getMappedFilename(mappingValue);
    if (!filename) {
      failures.push(`${canonicalId}: missing mapped subtitle filename`);
      continue;
    }

    if (filename !== path.basename(filename)) {
      failures.push(`${canonicalId}: filename must not include path segments`);
      continue;
    }

    if (!/\.srt$/i.test(filename)) {
      failures.push(`${canonicalId}: subtitle filename must end with .srt`);
      continue;
    }

    const subtitlePath = path.join(AR_IMPROVED_DIR, filename);
    if (!fs.existsSync(subtitlePath)) {
      failures.push(`${canonicalId}: mapped file not found in ar-improved/: ${filename}`);
      continue;
    }

    let subtitleText;
    try {
      const fileBuffer = fs.readFileSync(subtitlePath);
      subtitleText = fileBuffer.toString('utf8');
    } catch (error) {
      failures.push(`${canonicalId}: failed to read subtitle as UTF-8 (${filename}): ${error.message}`);
      continue;
    }

    if (subtitleText.includes('�') || subtitleText.includes('\uFFFD')) {
      failures.push(`${canonicalId}: replacement character found in subtitle (${filename})`);
      continue;
    }

    const parsed = validateSrt(subtitleText, `${canonicalId} (${filename})`);
    if (parsed.failures.length) {
      failures.push(...parsed.failures);
      continue;
    }

    const episode = episodeMap.get(canonicalId);
    const englishLocalPath = getEnglishLocalPath(episode);
    if (!englishLocalPath) {
      warnings.push(`${canonicalId}: English reference not available locally.`);
      continue;
    }

    try {
      const englishText = fs.readFileSync(englishLocalPath, 'utf8');
      if (englishText.includes('�') || englishText.includes('\uFFFD')) {
        warnings.push(`${canonicalId}: Local English subtitle has unreadable UTF-8 characters.`);
        continue;
      }

      const englishParsed = validateSrt(englishText, `${canonicalId} (english reference)`);
      if (englishParsed.failures.length || englishParsed.cueCount <= 0) {
        warnings.push(`${canonicalId}: Local English subtitle could not be parsed for cue count comparison.`);
        continue;
      }

      const ratio = parsed.cueCount / englishParsed.cueCount;
      if (ratio < 0.5 || ratio > 1.5) {
        warnings.push(`${canonicalId}: Arabic Improved cue count (${parsed.cueCount}) is very different from local English (${englishParsed.cueCount}).`);
      }
    } catch (error) {
      warnings.push(`${canonicalId}: Failed to read local English subtitle for comparison (${error.message}).`);
    }
  }

  const torchwoodEpisodeMap = new Map(torchwoodEpisodes.map((episode) => [episodeToCanonicalId(episode), episode]));
  for (const [canonicalId, entry] of Object.entries(torchwoodMapping)) {
    const episode = torchwoodEpisodeMap.get(canonicalId);
    if (!episode || !episode.streams.length) {
      failures.push(`${canonicalId}: Torchwood Arabic mapping references an unavailable episode`);
      continue;
    }
    if (!entry || typeof entry !== 'object' || !['original', 'clean-cut'].includes(entry.variant)) {
      failures.push(`${canonicalId}: invalid Torchwood Arabic mapping entry`);
      continue;
    }
    const filename = getMappedFilename(entry);
    if (!filename || filename !== path.basename(filename) || !/\.srt$/i.test(filename)) {
      failures.push(`${canonicalId}: invalid Torchwood Arabic subtitle filename`);
      continue;
    }
    const directory = entry.variant === 'clean-cut' ? TORCHWOOD_AR_CLEAN_DIR : TORCHWOOD_AR_IMPROVED_DIR;
    const subtitlePath = path.join(directory, filename);
    if (!fs.existsSync(subtitlePath)) {
      failures.push(`${canonicalId}: mapped Torchwood Arabic file not found: ${filename}`);
      continue;
    }
    const subtitleText = fs.readFileSync(subtitlePath, 'utf8');
    if (subtitleText.includes('�') || subtitleText.includes('\uFFFD')) {
      failures.push(`${canonicalId}: replacement character found in Torchwood Arabic subtitle (${filename})`);
      continue;
    }
    const parsed = validateSrt(subtitleText, `${canonicalId} (${filename})`);
    failures.push(...parsed.failures);
  }

  const playableTorchwoodCount = torchwoodEpisodes.filter((episode) => episode.streams.length > 0).length;
  if (Object.keys(torchwoodMapping).length !== playableTorchwoodCount) {
    failures.push(`Torchwood Arabic mapping has ${Object.keys(torchwoodMapping).length} episodes; expected ${playableTorchwoodCount}`);
  }

  const result = {
    status: failures.length ? 'failed' : 'ok',
    mappedEpisodes: Object.keys(mapping).length,
    torchwoodMappedEpisodes: Object.keys(torchwoodMapping).length,
    failures,
    warnings
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) {
    process.exit(1);
  }
}

main();
