#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const arDir = path.join(ROOT, 'ar');
const arAltDir = path.join(ROOT, 'ar-alt');
const movieSubtitlePath = path.join(ROOT, 'movie-subtitles', 'doctor-who-movie-1996.primary.improved.ar.srt');
const torchwoodEnglishSubtitleDir = path.join(ROOT, 'torchwood-subtitles', 'en-clean');
const arabicSubtitles = require('../arabicSubtitles.json');
const arabicSubtitleAlternatives = require('../arabicSubtitleAlternatives.json');
const { DEFAULT_EPISODE_GENRES, buildEpisodeTagLine, buildEpisodeTagMetadata, formatEpisodeTagLabel } = require('../episodeTagMetadata');
const episodeTags = require('../episodeTags.json');
const episodeData = require('../episodeData');
const { CATALOGS, CONTENT_IDS, createContentLibrary } = require('../contentLibrary');
const { ARCHIVE_IDENTIFIERS: torchwoodArchiveIdentifiers, episodes: torchwoodEpisodes } = require('../torchwoodData');
const torchwoodEpisodeImages = require('../torchwoodEpisodeImages');
const {
  TORCHWOOD_EPISODE_TAGS,
  buildTorchwoodEpisodeOverview,
  buildTorchwoodEpisodeTagLine,
  buildTorchwoodStreamDescription
} = require('../torchwoodEpisodeTags');
const streamMetadata = require('../streamMetadata.json');
const subtitleStatus = require('../subtitleStatus.json');

const failures = [];
const warnings = [];
const EPISODE_TAG_IMPORTANCE = new Set(['canon', 'mid', 'filler']);
const EPISODE_TAG_WATCH_NOTES = new Set(['essential', 'recommended', 'optional', 'skippable', 'skippable-first-watch']);
const EPISODE_TAG_QUALITY_NOTES = new Set(['strong', 'good', 'okay', 'weak', 'controversial']);
const TORCHWOOD_TAG_IMPORTANCE = new Set(['essential', 'important', 'optional', 'skippable']);
const TORCHWOOD_TAG_CLEAN_STATUS = new Set(['original', 'clean-cut', 'unavailable']);
const TORCHWOOD_TAG_CONTENT_NOTE = new Set([
  'mild',
  'kissing-romance',
  'sexual-themes',
  'sexual-scene-removed',
  'strong-violence',
  'horror-violence',
  'mature-language',
  'disturbing-themes',
  'skipped'
]);
const TORCHWOOD_TAG_FIELDS = new Set(['title', 'importance', 'cleanStatus', 'contentNote', 'comment']);
const TORCHWOOD_CLEAN_ENGLISH_SUBTITLES = Object.freeze({
  S01E10: 'S01E10.clean.en.srt',
  S01E13: 'S01E13.clean.en.srt',
  S02E03: 'S02E03.clean.en.srt',
  S02E05: 'S02E05.clean.en.srt',
  S02E09: 'S02E09.clean.en.srt',
  S02E11: 'S02E11.clean.v2.en.srt',
  S04E03: 'S04E03.clean.en.srt',
  S04E07: 'S04E07.clean.en.srt'
});

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

function checkTorchwoodEnglishSubtitles() {
  const timingPattern = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/;
  const toMilliseconds = (match, offset) => (
    Number(match[offset]) * 3600000
    + Number(match[offset + 1]) * 60000
    + Number(match[offset + 2]) * 1000
    + Number(match[offset + 3])
  );

  for (const [canonicalId, filename] of Object.entries(TORCHWOOD_CLEAN_ENGLISH_SUBTITLES)) {
    const subtitlePath = path.join(torchwoodEnglishSubtitleDir, filename);
    if (!fs.existsSync(subtitlePath)) {
      fail(`Torchwood ${canonicalId} is missing clean English subtitle: ${filename}`);
      continue;
    }

    const text = fs.readFileSync(subtitlePath, 'utf8');
    if (text.includes('\uFFFD')) {
      fail(`Torchwood ${canonicalId} clean English subtitle is not valid UTF-8`);
      continue;
    }

    const blocks = text.replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split(/\n{2,}/);
    if (blocks.length < 400) {
      fail(`Torchwood ${canonicalId} clean English subtitle has too few cues (${blocks.length})`);
    }

    let previousStart = -1;
    blocks.forEach((block, index) => {
      const lines = block.split('\n');
      const timing = (lines[1] || '').match(timingPattern);
      if (Number(lines[0]) !== index + 1 || !timing || !lines.slice(2).some((line) => line.trim())) {
        fail(`Torchwood ${canonicalId} clean English subtitle has an invalid cue at position ${index + 1}`);
        return;
      }

      const start = toMilliseconds(timing, 1);
      const end = toMilliseconds(timing, 5);
      if (end <= start || start < previousStart) {
        fail(`Torchwood ${canonicalId} clean English subtitle timing is invalid at cue ${index + 1}`);
      }
      previousStart = start;
    });
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

function checkContentLibrary() {
  const assetBaseUrl = 'https://example.com/assets';
  const library = createContentLibrary({
    addonLogoUrl: 'https://example.com/assets/addon-logo.svg',
    assetBaseUrl
  });
  const newWho = library.getSeriesById(CONTENT_IDS.newWho);
  const torchwood = library.getSeriesById(CONTENT_IDS.torchwood);
  const movie = library.getMovieById(CONTENT_IDS.doctorWhoMovie1996);
  const allEntries = [...library.series, ...library.movies];

  if (CATALOGS.series.type !== 'series' || CATALOGS.movies.type !== 'movie' || CATALOGS.series.id === CATALOGS.movies.id) {
    fail('Content library catalogs must remain separate and type-specific');
  }
  if (library.series.length !== 2 || library.movies.length !== 1) {
    fail(`Content library has ${library.series.length} series and ${library.movies.length} movies; expected 2 and 1`);
  }
  if (newWho?.episodes !== episodeData || newWho?.sourceModule !== 'episodeData.js') {
    fail('Content library Doctor Who entry is detached from episodeData.js');
  }
  if (torchwood?.episodes !== torchwoodEpisodes || torchwood?.sourceModule !== 'torchwoodData.js') {
    fail('Content library Torchwood entry is detached from torchwoodData.js');
  }
  if (movie?.streams.length !== 1 || movie?.arabicImprovedSubtitle !== 'doctor-who-movie-1996.primary.improved.ar.srt') {
    fail('Content library Doctor Who 1996 movie references are invalid');
  }

  const ids = allEntries.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) {
    fail('Content library contains duplicate content IDs');
  }
  for (const entry of allEntries) {
    if (!entry.id || !entry.type || !entry.name || !entry.poster || !entry.background || !entry.description || !entry.catalogDescription || !entry.releaseInfo || !Array.isArray(entry.genres)) {
      fail(`Content library entry ${entry.id || '(missing ID)'} is missing high-level metadata`);
    }
    for (const artworkUrl of [entry.poster, entry.background]) {
      if (!artworkUrl.startsWith(`${assetBaseUrl}/`)) {
        fail(`Content library entry ${entry.id} does not use local title artwork`);
        continue;
      }

      const artworkFilename = artworkUrl.slice(assetBaseUrl.length + 1);
      if (!fs.existsSync(path.join(ROOT, 'assets', artworkFilename))) {
        fail(`Content library artwork is missing: assets/${artworkFilename}`);
      }
    }
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
  if (Object.keys(torchwoodEpisodeImages).length !== 41) {
    fail(`Torchwood has ${Object.keys(torchwoodEpisodeImages).length} IMDb episode images; expected 41`);
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

    const image = torchwoodEpisodeImages[canonicalId];
    if (!image || !/^tt\d+$/.test(image.imdbEpisodeId || '') || !image.imdbTitle || !image.url.startsWith('https://m.media-amazon.com/images/') || episode.thumbnail !== image.url) {
      fail(`Torchwood ${canonicalId} does not have a verified IMDb still mapping`);
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

function checkTorchwoodEpisodeTags() {
  const tags = TORCHWOOD_EPISODE_TAGS;
  const episodesById = new Map(torchwoodEpisodes.map((episode) => [episodeToCanonicalId(episode), episode]));
  const cleanEpisodeIds = new Set(['S01E10', 'S01E13', 'S02E03', 'S02E05', 'S02E09', 'S02E11', 'S04E03', 'S04E07']);
  const tagIds = Object.keys(tags);

  if (tagIds.length !== torchwoodEpisodes.length) {
    fail(`Torchwood has ${tagIds.length} tag entries; expected ${torchwoodEpisodes.length}`);
  }

  const tagPath = path.join(ROOT, 'torchwoodEpisodeTags.js');
  const rawTagIds = [...fs.readFileSync(tagPath, 'utf8').matchAll(/^\s*(S\d{2}E\d{2}):\s*Object\.freeze/gm)]
    .map((match) => match[1]);
  const duplicateIds = rawTagIds.filter((id, index) => rawTagIds.indexOf(id) !== index);
  if (duplicateIds.length) {
    fail(`torchwoodEpisodeTags.js contains duplicate canonical IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  for (const episode of torchwoodEpisodes) {
    const canonicalId = episodeToCanonicalId(episode);
    const tag = tags[canonicalId];
    if (!tag) {
      fail(`Torchwood ${canonicalId} is missing episode tags`);
      continue;
    }
    if (tag.title !== episode.title) {
      fail(`Torchwood ${canonicalId} tag title does not match torchwoodData.js`);
    }
    if (!TORCHWOOD_TAG_IMPORTANCE.has(tag.importance)
      || !TORCHWOOD_TAG_CLEAN_STATUS.has(tag.cleanStatus)
      || !TORCHWOOD_TAG_CONTENT_NOTE.has(tag.contentNote)) {
      fail(`Torchwood ${canonicalId} contains an invalid or missing tag value`);
    }
    const noisyFields = Object.keys(tag).filter((field) => !TORCHWOOD_TAG_FIELDS.has(field));
    if (noisyFields.length) {
      fail(`Torchwood ${canonicalId} contains noisy tag fields: ${noisyFields.join(', ')}`);
    }
    if (typeof tag.comment !== 'string' || !tag.comment.trim() || tag.comment.length > 80) {
      fail(`Torchwood ${canonicalId} tag comment must be short and non-empty`);
    }

    const expectedCleanStatus = canonicalId === 'S01E02'
      ? 'unavailable'
      : cleanEpisodeIds.has(canonicalId) ? 'clean-cut' : 'original';
    const expectedContentNote = canonicalId === 'S01E02'
      ? 'skipped'
      : cleanEpisodeIds.has(canonicalId) ? 'sexual-scene-removed' : null;
    if (tag.cleanStatus !== expectedCleanStatus || (expectedContentNote && tag.contentNote !== expectedContentNote)) {
      fail(`Torchwood ${canonicalId} tags do not match its stream availability`);
    }
    if (episode.season === 3 && tag.importance !== 'essential') {
      fail(`Torchwood ${canonicalId} must be tagged as essential`);
    }

    const tagLine = buildTorchwoodEpisodeTagLine(tag);
    const overview = buildTorchwoodEpisodeOverview(episode, tag);
    if (!tagLine || !overview.startsWith(tagLine) || !overview.endsWith(episode.overview)) {
      fail(`Torchwood ${canonicalId} tag metadata is not rendered correctly`);
    }
    const visibleTags = tagLine.match(/\[[^\]]+\]/g) || [];
    if (visibleTags.length !== 3
      || visibleTags[0] !== `[${formatEpisodeTagLabel(tag.importance)}]`
      || visibleTags[1] !== `[${formatEpisodeTagLabel(tag.cleanStatus)}]`
      || !visibleTags[2].startsWith('[Content: ')
      || /Character Focused|\[(?:Drama|Action|Thriller)\]|Quality:|Content: (?:Moderated|Mature)\b/.test(tagLine)) {
      fail(`Torchwood ${canonicalId} does not use exactly three concise visible tags`);
    }
    if (canonicalId === 'S01E02' && tagLine !== '[Skippable] [Unavailable] [Content: Skipped]') {
      fail('Torchwood S01E02 visible tags are incorrect');
    }
    for (const stream of episode.streams) {
      const description = buildTorchwoodStreamDescription(stream, tag);
      const expectedPrefix = `[${tag.cleanStatus === 'clean-cut' ? 'Clean Cut' : 'Original'}] [1080p] • `;
      const expectedSource = tag.cleanStatus === 'clean-cut' ? 'Torchwood Clean Cut' : 'Torchwood Original MKV';
      const streamTags = description.match(/\[[^\]]+\]/g) || [];
      if (!description.startsWith(`${expectedPrefix}${expectedSource} •`)
        || !description.endsWith(stream.description)
        || streamTags.length !== 2) {
        fail(`Torchwood ${canonicalId} stream tags are not rendered correctly`);
      }
    }
  }

  for (const canonicalId of tagIds) {
    if (!episodesById.has(canonicalId)) {
      fail(`torchwoodEpisodeTags.js references unknown episode ID: ${canonicalId}`);
    }
  }
}

function main() {
  checkNodeSyntax();
  checkConsistency();
  checkContentLibrary();
  checkTorchwoodData();
  checkEpisodeTags();
  checkEpisodeTagMetadata();
  checkTorchwoodEpisodeTags();
  checkArabicFiles();
  checkArabicAlternativeFiles();
  checkMovieSubtitle();
  checkTorchwoodEnglishSubtitles();
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
    torchwoodTaggedEpisodes: Object.keys(TORCHWOOD_EPISODE_TAGS).length,
    torchwoodCleanEnglishSubtitles: Object.keys(TORCHWOOD_CLEAN_ENGLISH_SUBTITLES).length,
    failures,
    warnings
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) {
    process.exit(1);
  }
}

main();
