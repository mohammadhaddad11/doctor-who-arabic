#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const arDir = path.join(ROOT, 'ar');
const arAltDir = path.join(ROOT, 'ar-alt');
const movieSubtitlePath = path.join(ROOT, 'movie-subtitles', 'doctor-who-movie-1996.primary.improved.ar.srt');
const arabicSubtitles = require('../arabicSubtitles.json');
const arabicSubtitleAlternatives = require('../arabicSubtitleAlternatives.json');
const { DEFAULT_EPISODE_GENRES, buildEpisodeTagLine, buildEpisodeTagMetadata } = require('../episodeTagMetadata');
const episodeTags = require('../episodeTags.json');
const episodeData = require('../episodeData');
const { ARCHIVE_IDENTIFIERS: torchwoodArchiveIdentifiers, episodes: torchwoodEpisodes } = require('../torchwoodData');
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

function checkMovieSubtitle() {
  if (!fs.existsSync(movieSubtitlePath)) {
    fail('Missing Doctor Who 1996 Arabic Improved movie subtitle');
    return;
  }

  const text = fs.readFileSync(movieSubtitlePath, 'utf8');
  if (text.includes('\uFFFD')) {
    fail('Doctor Who 1996 movie subtitle is not valid UTF-8');
  }

  const blocks = text.replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split(/\n{2,}/);
  if (blocks.length !== 960) {
    fail(`Doctor Who 1996 movie subtitle has ${blocks.length} cues; expected 960`);
  }

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    if (Number(lines[0]) !== index + 1 || !/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/.test(lines[1] || '') || lines.length < 3) {
      fail(`Doctor Who 1996 movie subtitle has an invalid cue at position ${index + 1}`);
    }
  });
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

function checkTorchwoodData() {
  const expectedArchiveIdentifiers = {
    clean: 'Torchwood.clean',
    season1: 'torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p',
    season2: 'torchwood-2x-04-carne-carne-dual-1080p',
    season3: 'torchwood-temporada-3-dual-1080p',
    season4: 'torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p'
  };
  const expectedTitles = {
    1: ['Everything Changes', 'Day One', 'Ghost Machine', 'Cyberwoman', 'Small Worlds', 'Countrycide', 'Greeks Bearing Gifts', 'They Keep Killing Suzie', 'Random Shoes', 'Out of Time', 'Combat', 'Captain Jack Harkness', 'End of Days'],
    2: ['Kiss Kiss, Bang Bang', 'Sleeper', 'To the Last Man', 'Meat', 'Adam', 'Reset', 'Dead Man Walking', 'A Day in the Death', 'Something Borrowed', 'From Out of the Rain', 'Adrift', 'Fragments', 'Exit Wounds'],
    3: ['Day One', 'Day Two', 'Day Three', 'Day Four', 'Day Five'],
    4: ['The New World', 'Rendition', 'Dead of Night', 'Escape to L.A.', 'The Categories of Life', 'The Middle Men', 'Immortal Sins', 'End of the Road', 'The Gathering', 'The Blood Line']
  };
  const cleanFilenames = new Map([
    ['S01E10', 'S01E10.clean.v2.fade.mp4'],
    ['S01E13', 'S01E13.clean.mp4'],
    ['S02E03', 'S02E03.clean.mp4'],
    ['S02E05', 'S02E05.clean.mp4'],
    ['S02E09', 'S02E09.clean.mp4'],
    ['S02E11', 'S02E11.clean.v2.mp4'],
    ['S04E03', 'S04E03.clean.mp4'],
    ['S04E07', 'S04E07.clean.mp4']
  ]);
  const expectedIds = new Set(
    Object.entries(expectedTitles).flatMap(([season, titles]) => (
      titles.map((title, index) => ({
        id: `S${String(season).padStart(2, '0')}E${String(index + 1).padStart(2, '0')}`,
        title
      }))
    )).map((entry) => entry.id)
  );

  if (JSON.stringify(torchwoodArchiveIdentifiers) !== JSON.stringify(expectedArchiveIdentifiers)) {
    fail('Torchwood uses unexpected Archive.org identifiers');
  }
  if (!Array.isArray(torchwoodEpisodes) || torchwoodEpisodes.length !== 41) {
    fail(`Torchwood has ${torchwoodEpisodes?.length || 0} episodes; expected 41`);
    return;
  }

  const seenIds = new Set();
  torchwoodEpisodes.forEach((episode) => {
    const canonicalId = episodeToCanonicalId(episode);
    const expectedTitle = expectedTitles[episode.season]?.[episode.episode - 1];
    if (!expectedIds.has(canonicalId) || episode.title !== expectedTitle || seenIds.has(canonicalId)) {
      fail(`Torchwood ${canonicalId} metadata is invalid or duplicated`);
    }
    seenIds.add(canonicalId);
    if (!episode.released || !episode.overview || !episode.thumbnail || !Array.isArray(episode.streams)) {
      fail(`Torchwood ${canonicalId} is missing required metadata`);
      return;
    }

    const expectedStreamCount = canonicalId === 'S01E02' ? 0 : 1;
    if (episode.streams.length !== expectedStreamCount) {
      fail(`Torchwood ${canonicalId} has ${episode.streams.length} streams; expected ${expectedStreamCount}`);
    }

    for (const stream of episode.streams) {
      const cleanFilename = cleanFilenames.get(canonicalId);
      const expectedIdentifier = cleanFilename
        ? torchwoodArchiveIdentifiers.clean
        : torchwoodArchiveIdentifiers[`season${episode.season}`];
      const expectedPrefix = `https://archive.org/download/${expectedIdentifier}/`;
      const expectedCleanUrl = cleanFilename
        ? `${expectedPrefix}${encodeURIComponent(cleanFilename)}`
        : null;
      const invalidCleanStream = cleanFilename && (
        stream.url !== expectedCleanUrl || !/Clean Cut/.test(stream.name || '')
      );
      const invalidOriginalStream = !cleanFilename && (
        !stream.url.endsWith('.mkv') || !/Original MKV/.test(stream.name || '')
      );

      if (!stream.url.startsWith(expectedPrefix) || invalidCleanStream || invalidOriginalStream || /50fps|\.ia\.mp4(?:$|\?)/i.test(stream.url) || /Arabic/i.test(stream.name || '')) {
        fail(`Torchwood ${canonicalId} has a disallowed stream URL or label`);
      }
    }
  });

  if (seenIds.size !== expectedIds.size || [...expectedIds].some((id) => !seenIds.has(id))) {
    fail('Torchwood episode coverage is incomplete');
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
    const comment = typeof tag.comment === 'string' && tag.comment.trim()
      ? ` ${tag.comment.trim()}`
      : '';
    const expectedOverview = `${expectedTagLine}${comment} — ${episode.overview}`;

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
  checkTorchwoodData();
  checkEpisodeTags();
  checkEpisodeTagMetadata();
  checkArabicFiles();
  checkArabicAlternativeFiles();
  checkMovieSubtitle();
  checkStreamMetadata();

  const result = {
    status: failures.length ? 'failed' : 'ok',
    episodes: episodeData.length,
    torchwoodEpisodes: torchwoodEpisodes.length,
    torchwoodStreamEpisodes: torchwoodEpisodes.filter((episode) => episode.streams.length > 0).length,
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
