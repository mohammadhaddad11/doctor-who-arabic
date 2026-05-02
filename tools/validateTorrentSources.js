#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodeData = require('../episodeData');

const ROOT = path.resolve(__dirname, '..');
const PRIMARY_PATH = path.join(ROOT, 'torrentSources.json');
const LOCAL_PATH = path.join(ROOT, 'torrentSources.local.json');
const AUDIT_PATH = path.join(ROOT, 'audit', 'torrent-fallback-audit.json');

const VALID_QUALITIES = new Set(['1080p', '720p', '480p']);
const VALID_CONFIDENCE = new Set(['high', 'medium', 'low']);
const VALID_SUBTITLE_COMPATIBILITY = new Set([
  'matches-current-archive-timing',
  'needs-different-subtitle',
  'unknown'
]);

function episodeToCanonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function readJsonFile(filePath, required) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      throw new Error(`Missing required file: ${path.basename(filePath)}`);
    }
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse ${path.basename(filePath)}: ${error.message}`);
  }
}

function toSourceArray(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.sources)) {
    return data.sources;
  }

  return [];
}

function pickEntryShape(entry) {
  return {
    canonicalId: entry.canonicalId || null,
    title: entry.title || null,
    type: entry.type || null,
    quality: entry.quality || null,
    infoHash: entry.infoHash || null,
    fileIdx: Number.isInteger(entry.fileIdx) ? entry.fileIdx : null,
    confidence: entry.confidence || null,
    subtitleCompatibility: entry.subtitleCompatibility || null,
    subtitleFile: entry.subtitleFile || null,
    subtitleUrl: entry.subtitleUrl || null,
    trackers: Array.isArray(entry.trackers) ? entry.trackers : [],
    sources: Array.isArray(entry.sources) ? entry.sources : [],
    sourceFile: entry.sourceFile || null
  };
}

function validateEntry(entry, validEpisodeIds) {
  const reasons = [];
  const warnings = [];

  if (!entry.canonicalId || !validEpisodeIds.has(entry.canonicalId)) {
    reasons.push('unknown episode ID');
  }

  if (entry.type !== 'torrent') {
    reasons.push('type must be torrent');
  }

  if (!VALID_QUALITIES.has(entry.quality)) {
    reasons.push('quality must be one of 1080p/720p/480p');
  }

  if (!entry.infoHash || !/^[a-fA-F0-9]{40}$/.test(entry.infoHash)) {
    reasons.push('missing or invalid infoHash');
  }

  if (!Number.isInteger(entry.fileIdx) || entry.fileIdx < 0) {
    reasons.push('missing or invalid fileIdx');
  }

  if (!VALID_CONFIDENCE.has(entry.confidence)) {
    reasons.push('confidence must be high/medium/low');
  } else if (entry.confidence === 'low') {
    reasons.push('low confidence is not allowed');
  }

  if (!VALID_SUBTITLE_COMPATIBILITY.has(entry.subtitleCompatibility)) {
    reasons.push('subtitleCompatibility is invalid');
  } else if (entry.subtitleCompatibility === 'unknown') {
    reasons.push('subtitleCompatibility cannot be unknown');
  } else if (entry.subtitleCompatibility === 'needs-different-subtitle' && !entry.subtitleFile && !entry.subtitleUrl) {
    reasons.push('needs-different-subtitle requires subtitleFile or subtitleUrl');
  }

  if (!entry.trackers.length) {
    warnings.push('no trackers provided');
  }

  return { reasons, warnings };
}

function main() {
  const validEpisodeIds = new Set(episodeData.map((episode) => episodeToCanonicalId(episode)));

  const primary = readJsonFile(PRIMARY_PATH, true);
  const local = readJsonFile(LOCAL_PATH, false);

  const rawEntries = [
    ...toSourceArray(primary).map((entry) => ({ ...entry, sourceFile: path.basename(PRIMARY_PATH) })),
    ...toSourceArray(local).map((entry) => ({ ...entry, sourceFile: path.basename(LOCAL_PATH) }))
  ];

  const accepted = [];
  const rejected = [];
  const warnings = [];

  for (const rawEntry of rawEntries) {
    const entry = pickEntryShape(rawEntry);
    const check = validateEntry(entry, validEpisodeIds);

    if (check.warnings.length) {
      warnings.push({ entry, warnings: check.warnings });
    }

    if (check.reasons.length) {
      rejected.push({ entry, reasons: check.reasons });
      continue;
    }

    accepted.push(entry);
  }

  const episodesWithAcceptedFallback = [...new Set(accepted.map((entry) => entry.canonicalId))];
  const report = {
    generatedAt: new Date().toISOString(),
    loadedFiles: [
      path.basename(PRIMARY_PATH),
      fs.existsSync(LOCAL_PATH) ? path.basename(LOCAL_PATH) : null
    ].filter(Boolean),
    summary: {
      totalEntries: rawEntries.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      warningCount: warnings.length,
      episodesWithAcceptedFallbackCount: episodesWithAcceptedFallback.length,
      episodesWithAcceptedFallback
    },
    accepted,
    rejected,
    warnings
  };

  fs.writeFileSync(AUDIT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);

  if (rejected.length > 0) {
    process.exit(1);
  }
}

main();
