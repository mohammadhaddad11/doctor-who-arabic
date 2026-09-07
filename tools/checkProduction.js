#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const arDir = path.join(ROOT, 'ar');
const arAltDir = path.join(ROOT, 'ar-alt');
const arabicSubtitles = require('../arabicSubtitles.json');
const arabicSubtitleAlternatives = require('../arabicSubtitleAlternatives.json');
const { DEFAULT_EPISODE_GENRES, buildEpisodeTagLine, buildEpisodeTagMetadata } = require('../episodeTagMetadata');
const episodeTags = require('../episodeTags.json');
const episodeData = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');
const subtitleStatus = require('../subtitleStatus.json');

const failures = [];
const warnings = [];
const EPISODE_TAG_IMPORTANCE = new Set(['canon', 'mid', 'filler']);
const EPISODE_TAG_WATCH_NOTES = new Set(['essential', 'recommended', 'optional', 'skippable', 'skippable-first-watch']);
const EPISODE_TAG_QUALITY_NOTES = new Set(['strong', 'good', 'okay', 'weak', 'controversial']);

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

function episodeToCanonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function checkEpisodeTags() {
  if (!episodeTags || typeof episodeTags !== 'object' || Array.isArray(episodeTags)) {
    fail('episodeTags.json must be an object keyed by canonical episode ID');
    return;
  }

  const tagPath = path.join(ROOT, 'episodeTags.json');
  const rawTagIds = [...fs.readFileSync(tagPath, 'utf8').matchAll(/^\s*"(S\d{2}E\d{2})"\s*:/gm)]
    .map((match) => match[1]);
  const duplicateIds = rawTagIds.filter((id, index) => rawTagIds.indexOf(id) !== index);
  if (duplicateIds.length) {
    fail(`episodeTags.json contains duplicate canonical IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  const episodesById = new Map(episodeData.map((episode) => [episodeToCanonicalId(episode), episode]));
  const episodeIdsByTitle = new Map(episodeData.map((episode) => [episode.title, episodeToCanonicalId(episode)]));
  const seenTitles = new Set();

  for (const [canonicalId, tag] of Object.entries(episodeTags)) {
    const episode = episodesById.get(canonicalId);
    if (!episode) {
      fail(`episodeTags.json references unknown episode ID: ${canonicalId}`);
      continue;
    }

    if (!tag || typeof tag !== 'object' || Array.isArray(tag)) {
      fail(`${canonicalId}: episode tag must be an object`);
      continue;
    }

    if (tag.title !== episode.title) {
      fail(`${canonicalId}: tag title does not match episodeData.js (${tag.title || '(missing)'} != ${episode.title})`);
    }

    if (seenTitles.has(tag.title)) {
      fail(`${canonicalId}: duplicate tagged title (${tag.title})`);
    }
    seenTitles.add(tag.title);

    const titleCanonicalId = episodeIdsByTitle.get(tag.title);
    if (titleCanonicalId && titleCanonicalId !== canonicalId) {
      fail(`${canonicalId}: title belongs to ${titleCanonicalId}; possible minisode/prequel shift`);
    }

    if (!EPISODE_TAG_IMPORTANCE.has(tag.importance)) {
      fail(`${canonicalId}: invalid importance (${tag.importance || '(missing)'})`);
    }
    if (!EPISODE_TAG_WATCH_NOTES.has(tag.watchNote)) {
      fail(`${canonicalId}: invalid watchNote (${tag.watchNote || '(missing)'})`);
    }
    if (!EPISODE_TAG_QUALITY_NOTES.has(tag.qualityNote)) {
      fail(`${canonicalId}: invalid qualityNote (${tag.qualityNote || '(missing)'})`);
    }
    if (typeof tag.comment !== 'string' || !tag.comment.trim()) {
      fail(`${canonicalId}: comment must be a non-empty string`);
    }
  }
}

function checkEpisodeTagMetadata() {
  const episodesById = new Map(episodeData.map((episode) => [episodeToCanonicalId(episode), episode]));

  for (const [canonicalId, tag] of Object.entries(episodeTags)) {
    const episode = episodesById.get(canonicalId);
    if (!episode) {
      continue;
    }

    const metadata = buildEpisodeTagMetadata(episode, tag);
    const expectedTagLine = buildEpisodeTagLine(tag);
    const expectedOverview = `${expectedTagLine} —\n\n${episode.overview}`;

    if (metadata.overview !== expectedOverview) {
      fail(`${canonicalId}: bracket tags are missing from the episode description`);
    }
    if (/^(?:Tags:|Episode Tags|Note:|Summary\b)/.test(metadata.overview || '')) {
      fail(`${canonicalId}: description contains a forbidden episode tag heading`);
    }
    if (metadata.genres.join('|') !== DEFAULT_EPISODE_GENRES.join('|')) {
      fail(`${canonicalId}: episode tags leaked into genres`);
    }
  }

  for (const episode of episodeData) {
    const canonicalId = episodeToCanonicalId(episode);
    if (episodeTags[canonicalId]) {
      continue;
    }

    const metadata = buildEpisodeTagMetadata(episode, null);
    if (metadata.overview !== episode.overview || metadata.genres.join('|') !== DEFAULT_EPISODE_GENRES.join('|')) {
      fail(`${canonicalId}: untagged episode metadata changed unexpectedly`);
    }
  }
}

function main() {
  checkNodeSyntax();
  checkConsistency();
  checkEpisodeTags();
  checkEpisodeTagMetadata();
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
    taggedEpisodes: Object.keys(episodeTags).length,
    failures,
    warnings
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) {
    process.exit(1);
  }
}

main();
