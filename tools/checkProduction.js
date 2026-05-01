#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const arDir = path.join(ROOT, 'ar');
const arAltDir = path.join(ROOT, 'ar-alt');
const arabicSubtitles = require('../arabicSubtitles.json');
const arabicSubtitleAlternatives = require('../arabicSubtitleAlternatives.json');
const episodeData = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');
const subtitleStatus = require('../subtitleStatus.json');

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function checkNodeSyntax() {
  const result = spawnSync(process.execPath, ['-c', 'index.js'], {
    cwd: ROOT,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    fail(`index.js syntax check failed: ${(result.stderr || result.stdout || '').trim()}`);
  }
}

function checkArabicFiles() {
  if (!fs.existsSync(arDir)) {
    fail('Missing production ar/ directory');
    return;
  }

  let bomCount = 0;
  for (const filename of arabicSubtitles) {
    const filePath = path.join(arDir, filename);
    if (!fs.existsSync(filePath)) {
      fail(`Missing production subtitle file: ${filename}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      bomCount += 1;
    }

    const text = buffer.toString('utf8');
    if (text.includes('\uFFFD')) {
      fail(`Unreadable UTF-8 subtitle content detected: ${filename}`);
    }

    if (!/-->/.test(text)) {
      fail(`Subtitle file does not look like SRT: ${filename}`);
    }
  }

  if (bomCount === 0) {
    warn('No production subtitles currently start with UTF-8 BOM');
  }
}

function checkArabicAlternativeFiles() {
  if (!fs.existsSync(arAltDir)) {
    warn('Missing ar-alt/ directory, no Arabic alternatives will be available');
    return;
  }

  for (const [primaryName, alternatives] of Object.entries(arabicSubtitleAlternatives)) {
    if (!arabicSubtitles.includes(primaryName)) {
      fail(`Arabic alternative index references non-primary subtitle: ${primaryName}`);
      continue;
    }

    for (const entry of alternatives || []) {
      const filePath = path.join(arAltDir, entry.filename || '');
      if (!entry.filename || !fs.existsSync(filePath)) {
        fail(`Missing Arabic alternative subtitle file: ${entry.filename || '(empty filename)'}`);
        continue;
      }

      const text = fs.readFileSync(filePath, 'utf8');
      if (!/-->/.test(text)) {
        fail(`Arabic alternative file does not look like SRT: ${entry.filename}`);
      }
    }
  }
}

function checkStreamMetadata() {
  const episodes = streamMetadata.episodes || {};
  const episodeEntries = Object.values(episodes);

  if (!episodeEntries.length) {
    fail('streamMetadata.json contains no episode entries');
    return;
  }

  const primary1080p = episodeEntries.filter((entry) => entry.primary && entry.primary.label === '1080p');
  if (!primary1080p.length) {
    fail('No 1080p primary stream entries found');
  }

  for (const entry of episodeEntries) {
    if (!entry.primary || !entry.primary.url) {
      fail(`Missing primary stream URL for ${entry.canonicalId || entry.title}`);
      continue;
    }

    if (entry.primary.label !== '1080p') {
      fail(`Primary stream is not labeled 1080p for ${entry.canonicalId || entry.title}`);
    }

    for (const alt of entry.alternatives || []) {
      if (alt.label === '480p' && !alt.url) {
        fail(`480p alternative missing URL for ${entry.canonicalId || entry.title}`);
      }
    }
  }
}

function checkConsistency() {
  if (!Array.isArray(episodeData) || !episodeData.length) {
    fail('episodeData.js did not load correctly');
  }

  if (typeof subtitleStatus !== 'object' || !subtitleStatus.entries) {
    fail('subtitleStatus.json did not load correctly');
  }

  if (arabicSubtitles.length !== Object.keys(subtitleStatus.entries || {}).length) {
    fail('subtitleStatus.json entry count does not match arabicSubtitles.json');
  }
}

function main() {
  checkNodeSyntax();
  checkConsistency();
  checkArabicFiles();
  checkArabicAlternativeFiles();
  checkStreamMetadata();

  const result = {
    status: failures.length ? 'failed' : 'ok',
    episodes: episodeData.length,
    arabicSubtitles: arabicSubtitles.length,
    arabicAlternatives: Object.keys(arabicSubtitleAlternatives).length,
    streamEpisodes: Object.keys(streamMetadata.episodes || {}).length,
    manualReviewSubtitles: subtitleStatus.summary?.manual_review || 0,
    failures,
    warnings
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) {
    process.exit(1);
  }
}

main();
