const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { addonBuilder, getRouter } = require('stremio-addon-sdk');
const allNewWhoEpisodesPreSorted = require('./episodeData');
const arabicSubtitleFiles = require('./arabicSubtitles.json');

function loadJsonFile(relativePath, fallbackValue) {
  const filePath = path.join(__dirname, relativePath);
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`Failed to load ${relativePath}:`, error.message);
    return fallbackValue;
  }
}

const arabicSubtitleAlternatives = loadJsonFile('arabicSubtitleAlternatives.json', {});
const streamMetadata = loadJsonFile('streamMetadata.json', { episodes: {}, summary: {} });
const subtitleStatus = loadJsonFile('subtitleStatus.json', { entries: {}, summary: {} });
const torrentSources = loadJsonFile('torrentSources.json', { sources: [] });
const torrentSourcesLocal = loadJsonFile('torrentSources.local.json', { sources: [] });
const torrentFallbackAudit = loadJsonFile('audit/torrent-fallback-audit.json', { summary: {} });

const NEW_WHO_SERIES_STREMIO_ID = 'whoniverse_new_who';
const ARABIC_SUBTITLE_FILES = new Set(arabicSubtitleFiles);
const ARABIC_ALT_INDEX = arabicSubtitleAlternatives || {};
const STREAM_METADATA_EPISODES = streamMetadata.episodes || {};
const STREAM_SUMMARY = streamMetadata.summary || {};
const SUBTITLE_STATUS_ENTRIES = subtitleStatus.entries || {};
const SUBTITLE_STATUS_SUMMARY = subtitleStatus.summary || {};
const TORRENT_FALLBACK_AUDIT_SUMMARY = torrentFallbackAudit.summary || {};

const ARABIC_SUBTITLE_DIR = path.join(__dirname, 'ar');
const ARABIC_SUBTITLE_ROUTE = '/subtitles/ar';
const ARABIC_ALT_SUBTITLE_DIR = path.join(__dirname, 'ar-alt');
const ARABIC_ALT_SUBTITLE_ROUTE = '/subtitles/ar-alt';
const ASSET_DIR = path.join(__dirname, 'assets');
const ASSET_ROUTE = '/assets';
const VIDEO_ROUTE = '/video';
const port = Number(process.env.PORT) || 7000;
const host = process.env.HOST || '0.0.0.0';
const REPORT_PATH = '/report';
const REVIEW_SUBTITLE_DIR = path.join(__dirname, 'review', 'arabic-subtitles');
const GITHUB_ISSUE_TEMPLATE_URL = 'https://github.com/mohammadhaddad11/doctor-who-arabic/issues/new?template=subtitle-issue.md';
const MIRROR_CACHE_TTL_MS = 15 * 60 * 1000;
const MIRROR_PROBE_TIMEOUT_MS = 2200;
const MIRROR_PROBE_MAX_CANDIDATES = 3;
const DEFAULT_ADDON_LOGO_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const LOCAL_ADDON_LOGO_FILE = path.join(ASSET_DIR, 'whoniverse-arabic-logo.svg');

const DYNAMIC_REDIRECT_EPISODE_IDS = new Set([
  'S01E15',
  'S02E14',
  'S03E01',
  'S03E07',
  'S03E12',
  'S03E16',
  'S04E19',
  'S04E20',
  'S05E06',
  'S05E18',
  'S07E14',
  'S07E30',
  'S07E31',
  'S08E05',
  'S10E03',
  'S13E07',
  'S13E08',
  'S14E03',
  'S14E04',
  'S15E01',
  'S08E14'
]);

const archiveMetadataCache = new Map();
const mirrorSelectionCache = new Map();
const subtitleVersionCache = new Map();
const SHOW_TORRENT_FALLBACK = String(process.env.SHOW_TORRENT_FALLBACK || '').toLowerCase() === 'true';
const FORCE_SPEED_480_EPISODE_IDS = new Set(['S04E01']);
const SLOW_DYNAMIC_REDIRECT_EPISODE_IDS = new Set(
  Object.entries(STREAM_METADATA_EPISODES)
    .filter(([, entry]) => entry?.primary?.speedCategory === 'SLOW')
    .map(([canonicalId]) => canonicalId)
);

const TORRENT_QUALITY_RANK = {
  '1080p': 3,
  '720p': 2,
  '480p': 1
};

const TORRENT_CONFIDENCE_RANK = {
  high: 3,
  medium: 2,
  low: 1
};

const SIZE_LABEL_BYTES = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024
};

const INTERNAL_FAST_START_1080P_CANDIDATES = Object.freeze({
  S05E02: 'https://ia600708.us.archive.org/17/items/nw_S05/E02_meanwhile_in_the_tardis1_minisode.ia.mp4',
  S05E11: 'https://archive.org/download/nw_S05/E11_cold_blood.ia.mp4',
  S12E01: 'https://ia800904.us.archive.org/13/items/nw_S12/E01_spyfall_part1.ia.mp4',
  S13E02: 'https://ia800705.us.archive.org/27/items/nw_S13/E02_war_of_the_sontarans.ia.mp4',
  S13E05: 'https://ia800705.us.archive.org/27/items/nw_S13/E05_survivors_of_the_flux.ia.mp4',
  S14E01: 'https://ia600909.us.archive.org/11/items/nw_S14/E01_destination_skaro_minisode.ia.mp4',
  S14E03: 'https://ia600909.us.archive.org/11/items/nw_S14/E03_wild_blue_yonder_special.ia.mp4',
  S14E04: 'https://ia600909.us.archive.org/11/items/nw_S14/E04_the_giggle_special.ia.mp4',
  S15E03: 'https://ia800704.us.archive.org/4/items/nw_S15/E03_the_devils_chord.ia.mp4',
  S16E01: 'https://ia800900.us.archive.org/19/items/nw_S16/E01_the_robot_revolution.ia.mp4'
});

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function resolvePublicBaseUrl() {
  const directBaseUrl = process.env.ADDON_BASE_URL || process.env.PUBLIC_URL;

  if (directBaseUrl) {
    return trimTrailingSlash(directBaseUrl);
  }

  return `http://127.0.0.1:${port}`;
}

const PUBLIC_ADDON_BASE_URL = resolvePublicBaseUrl();
const ADDON_LOGO_URL = fs.existsSync(LOCAL_ADDON_LOGO_FILE)
  ? `${PUBLIC_ADDON_BASE_URL}${ASSET_ROUTE}/whoniverse-arabic-logo.svg`
  : DEFAULT_ADDON_LOGO_URL;
const NEW_WHO_SERIES_POSTER_URL = ADDON_LOGO_URL;
const NEW_WHO_SERIES_BACKGROUND_URL = ADDON_LOGO_URL;

const manifest = {
  id: 'community.mhaddad.whoniverse.arabic',
  version: '1.5.0',
  name: 'Whoniverse Arabic 1080p',
  description: 'Doctor Who for Stremio with separate English and Arabic subtitle tracks plus simple 1080p quality and 480p speed stream options.',
  logo: ADDON_LOGO_URL,
  types: ['series'],
  resources: ['catalog', 'meta', 'stream', 'subtitles'],
  catalogs: [
    {
      type: 'series',
      id: 'whoniverse_catalog',
      name: 'Whoniverse'
    }
  ],
  behaviorHints: {
    configurable: false,
    adult: false
  }
};

const builder = new addonBuilder(manifest);

const allNewWhoEpisodes = [...allNewWhoEpisodesPreSorted].sort((a, b) => {
  const dateA = new Date(a.released);
  const dateB = new Date(b.released);

  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
    console.warn('Invalid date found during sort:', a.released, b.released);
    return 0;
  }

  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  if (a.season !== b.season) return a.season - b.season;
  return a.episode - b.episode;
});

function getEpisodeFromArgs(id) {
  const [seriesId, seasonStr, episodeStr] = id.split(':');

  if (seriesId !== NEW_WHO_SERIES_STREMIO_ID) {
    return null;
  }

  const season = Number.parseInt(seasonStr, 10);
  const episodeNum = Number.parseInt(episodeStr, 10);

  return allNewWhoEpisodes.find((ep) => ep.season === season && ep.episode === episodeNum) || null;
}

function getEpisodeFromCanonicalId(canonicalId) {
  return allNewWhoEpisodes.find((episode) => getEpisodeKey(episode) === canonicalId) || null;
}

function getEpisodeKey(episode) {
  if (!episode) {
    return null;
  }

  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function isSpecialEpisode(episode) {
  return /\(Special\)$/i.test(episode?.title || '');
}

function getEnglishSubtitleFilename(episode) {
  if (!episode || !episode.subtitleUrl) {
    return null;
  }

  return episode.subtitleUrl.split('/').pop() || null;
}

function getArabicSubtitleFilename(episode) {
  const englishName = getEnglishSubtitleFilename(episode);
  if (!englishName || !/\.srt$/i.test(englishName)) {
    return null;
  }

  return englishName.replace(/\.srt$/i, '.ar.srt');
}

function getArabicSubtitleFilePath(arabicName) {
  return path.join(ARABIC_SUBTITLE_DIR, arabicName);
}

function getArabicAltSubtitleFilePath(arabicName) {
  return path.join(ARABIC_ALT_SUBTITLE_DIR, arabicName);
}

function getSubtitleContentVersion(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  try {
    const stats = fs.statSync(filePath);
    const cached = subtitleVersionCache.get(filePath);
    if (cached && cached.mtimeMs === stats.mtimeMs && cached.size === stats.size) {
      return cached.version;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const version = crypto.createHash('sha1').update(fileBuffer).digest('hex').slice(0, 12);
    subtitleVersionCache.set(filePath, {
      mtimeMs: stats.mtimeMs,
      size: stats.size,
      version
    });
    return version;
  } catch (error) {
    console.warn(`Unable to hash subtitle for cache busting (${filePath}):`, error.message);
    return null;
  }
}

function buildArabicSubtitleUrl(arabicName) {
  const subtitlePath = getArabicSubtitleFilePath(arabicName);
  const version = getSubtitleContentVersion(subtitlePath);
  const baseUrl = `${PUBLIC_ADDON_BASE_URL}${ARABIC_SUBTITLE_ROUTE}/${encodeURIComponent(arabicName)}`;
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}

function buildArabicAltSubtitleUrl(arabicName) {
  const subtitlePath = getArabicAltSubtitleFilePath(arabicName);
  const version = getSubtitleContentVersion(subtitlePath);
  const baseUrl = `${PUBLIC_ADDON_BASE_URL}${ARABIC_ALT_SUBTITLE_ROUTE}/${encodeURIComponent(arabicName)}`;
  return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
}

function getAssetFilePath(assetName) {
  return path.join(ASSET_DIR, path.basename(assetName));
}

function getArabicSubtitleUrl(episode) {
  const arabicName = getArabicSubtitleFilename(episode);
  if (!arabicName || !ARABIC_SUBTITLE_FILES.has(arabicName)) {
    return null;
  }

  const arabicPath = getArabicSubtitleFilePath(arabicName);
  if (!fs.existsSync(arabicPath)) {
    return null;
  }

  return buildArabicSubtitleUrl(arabicName);
}

function getArabicAlternativeTracks(episode) {
  const primaryArabicName = getArabicSubtitleFilename(episode);
  if (!primaryArabicName) {
    return [];
  }

  const alternatives = ARABIC_ALT_INDEX[primaryArabicName] || [];
  return alternatives
    .filter((entry) => entry && entry.filename)
    .filter((entry) => fs.existsSync(getArabicAltSubtitleFilePath(entry.filename)))
    .map((entry, index) => ({
      id: `arabic_alt_${index + 1}`,
      url: buildArabicAltSubtitleUrl(entry.filename),
      lang: entry.label || `Arabic Alt${index > 0 ? ` ${index + 1}` : ''}`
    }));
}

function getSubtitleTracks(episode) {
  if (!episode) {
    return [];
  }

  const subtitles = [];

  if (episode.subtitleUrl) {
    subtitles.push({
      id: 'archive_en_sub',
      url: episode.subtitleUrl,
      lang: 'English'
    });
  }

  const arabicUrl = getArabicSubtitleUrl(episode);
  if (arabicUrl) {
    subtitles.push({
      id: 'local_ar_sub',
      url: arabicUrl,
      lang: 'Arabic'
    });
  }

  subtitles.push(...getArabicAlternativeTracks(episode));

  return subtitles;
}

function getEpisodeStreamMetadata(episode) {
  const key = getEpisodeKey(episode);
  return key ? STREAM_METADATA_EPISODES[key] || null : null;
}

function parseSizeLabelToBytes(sizeLabel) {
  if (typeof sizeLabel !== 'string') {
    return null;
  }

  const match = sizeLabel.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  const multiplier = SIZE_LABEL_BYTES[unit];
  if (!Number.isFinite(value) || !multiplier) {
    return null;
  }

  const bytes = Math.round(value * multiplier);
  return bytes > 0 ? bytes : null;
}

function getStreamBytes(streamEntry) {
  if (!streamEntry || typeof streamEntry !== 'object') {
    return null;
  }

  const directBytes = Number(streamEntry.sizeBytes);
  if (Number.isFinite(directBytes) && directBytes > 0) {
    return Math.round(directBytes);
  }

  return parseSizeLabelToBytes(streamEntry.sizeLabel);
}

function isArchiveUrl(url) {
  try {
    const parsed = new URL(url);
    return /archive\.org$/i.test(parsed.hostname) || /\.archive\.org$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function buildVideoRedirectUrl(episode, quality) {
  return `${PUBLIC_ADDON_BASE_URL}${VIDEO_ROUTE}/${encodeURIComponent(getEpisodeKey(episode))}/${encodeURIComponent(quality)}`;
}

function shouldUseDynamicRedirect(episode, streamEntry) {
  if (!episode || !streamEntry || !streamEntry.url) {
    return false;
  }

  if (!isArchiveUrl(streamEntry.url)) {
    return false;
  }

  const canonicalId = getEpisodeKey(episode);
  if (!canonicalId) {
    return false;
  }

  return DYNAMIC_REDIRECT_EPISODE_IDS.has(canonicalId) || SLOW_DYNAMIC_REDIRECT_EPISODE_IDS.has(canonicalId);
}

function parseArchiveItemId(url) {
  const match = url.match(/archive\.org\/(?:download|metadata)\/([^/]+)/i);
  return match ? match[1] : null;
}

function getArchiveMetadata(itemId) {
  if (!itemId) {
    return null;
  }

  if (archiveMetadataCache.has(itemId)) {
    return archiveMetadataCache.get(itemId);
  }

  const filePath = path.join(__dirname, '.subtitle-audit-cache', 'metadata', `${itemId}.json`);
  if (!fs.existsSync(filePath)) {
    archiveMetadataCache.set(itemId, null);
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  archiveMetadataCache.set(itemId, parsed);
  return parsed;
}

function getStreamEntryCandidatesForQuality(metadata, quality) {
  if (!metadata) {
    return [];
  }

  if (quality === '1080p') {
    const candidates = [...(metadata.primaryCandidates || [])];
    const fastStartUrl = INTERNAL_FAST_START_1080P_CANDIDATES[metadata.canonicalId || ''];

    if (fastStartUrl && !candidates.some((candidate) => candidate?.url === fastStartUrl)) {
      const baseStartup = metadata.primary?.startupScore || metadata.primary?.responseTimeMs || 1200;
      const baseHealth = metadata.primary?.healthScore || 90;
      candidates.unshift({
        url: fastStartUrl,
        healthScore: Math.max(1, Math.min(100, baseHealth + 1)),
        probe: {
          startupScore: Math.max(1, baseStartup - 250)
        }
      });
    }

    return candidates;
  }

  const alternative = (metadata.alternatives || []).find((entry) => entry.label === quality);
  if (!alternative) {
    return [];
  }

  const archiveItem = metadata.archiveItem || parseArchiveItemId(alternative.url);
  const archiveMetadata = getArchiveMetadata(archiveItem);
  if (!archiveMetadata) {
    return [{ url: alternative.url, healthScore: alternative.healthScore || 0, probe: { startupScore: alternative.startupScore || alternative.responseTimeMs || Infinity } }];
  }

  const filename = alternative.finalUrl ? path.basename(new URL(alternative.finalUrl).pathname) : path.basename(new URL(alternative.url).pathname);
  const urls = new Map();
  const addCandidate = (url) => {
    if (!url || urls.has(url)) {
      return;
    }

    urls.set(url, {
      url,
      healthScore: url === alternative.url ? (alternative.healthScore || 0) : 0,
      probe: {
        startupScore: url === alternative.url ? (alternative.startupScore || alternative.responseTimeMs || Infinity) : Infinity
      }
    });
  };

  addCandidate(alternative.url);
  for (const location of archiveMetadata.alternate_locations?.workable || archiveMetadata.alternate_locations?.servers || []) {
    if (location.server && location.dir) {
      addCandidate(`https://${location.server}${location.dir}/${filename}`);
    }
  }
  for (const hostName of [archiveMetadata.d1, archiveMetadata.d2]) {
    if (hostName && archiveMetadata.dir) {
      addCandidate(`https://${hostName}${archiveMetadata.dir}/${filename}`);
    }
  }
  addCandidate(`https://archive.org/download/${archiveItem}/${filename}`);
  return [...urls.values()];
}

function getKnownQualitySourceUrl(metadata, quality) {
  if (!metadata) {
    return null;
  }

  if (quality === '1080p') {
    return metadata.primary?.url || null;
  }

  return (metadata.alternatives || []).find((entry) => entry.label === quality)?.url || null;
}

async function probeMirrorCandidate(url, timeoutMs = MIRROR_PROBE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'user-agent': 'WhoniverseMirrorRedirect/1.0',
        Range: 'bytes=0-65535'
      }
    });

    const sample = Buffer.from(await response.arrayBuffer());
    clearTimeout(timer);
    const startupScore = Date.now() - startedAt;
    return {
      url,
      responseStatus: response.status,
      startupScore,
      healthScore: [200, 206].includes(response.status) ? Math.max(1, 100 - Math.min(70, Math.round(startupScore / 160))) : 0,
      sampleBytes: sample.length,
      finalUrl: response.url || url
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      url,
      responseStatus: 0,
      startupScore: Date.now() - startedAt,
      healthScore: 0,
      sampleBytes: 0,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
      finalUrl: url
    };
  }
}

async function chooseMirrorRedirectTarget(episode, quality) {
  const key = `${getEpisodeKey(episode)}:${quality}`;
  const now = Date.now();
  const cached = mirrorSelectionCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const metadata = getEpisodeStreamMetadata(episode);
  const candidates = getStreamEntryCandidatesForQuality(metadata, quality)
    .filter((candidate) => candidate && candidate.url)
    .sort((a, b) => {
      if ((b.healthScore || 0) !== (a.healthScore || 0)) {
        return (b.healthScore || 0) - (a.healthScore || 0);
      }

      return (a.probe?.startupScore || Infinity) - (b.probe?.startupScore || Infinity);
    });

  if (!candidates.length) {
    return null;
  }

  const fallbackUrl = getKnownQualitySourceUrl(metadata, quality) || candidates[0].url;
  let selectedUrl = null;
  const probeCandidates = candidates.slice(0, MIRROR_PROBE_MAX_CANDIDATES);

  for (const candidate of probeCandidates) {
    const result = await probeMirrorCandidate(candidate.url);
    if ([200, 206].includes(result.responseStatus)) {
      selectedUrl = candidate.url;
      break;
    }
  }

  if (!selectedUrl) {
    selectedUrl = fallbackUrl;
  }

  mirrorSelectionCache.set(key, {
    url: selectedUrl,
    expiresAt: now + MIRROR_CACHE_TTL_MS
  });
  return selectedUrl;
}

async function redirectDynamicStream(req, res, canonicalId, quality) {
  const episode = getEpisodeFromCanonicalId(canonicalId);
  if (!episode) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ err: 'episode not found' }));
    return;
  }

  const targetUrl = await chooseMirrorRedirectTarget(episode, quality);
  if (!targetUrl) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ err: 'stream quality not available' }));
    return;
  }

  sendCorsHeaders(res);
  res.statusCode = 302;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', targetUrl);
  res.end();
}

function getMetadataBackedStreams(episode) {
  const metadata = getEpisodeStreamMetadata(episode);

  if (!metadata || !metadata.primary) {
    return [];
  }

  const canonicalId = getEpisodeKey(episode);

  const speedAlternative = (metadata.alternatives || [])
    .filter((entry) => entry.label === '480p')
    .sort((a, b) => {
      if ((b.healthScore || 0) !== (a.healthScore || 0)) {
        return (b.healthScore || 0) - (a.healthScore || 0);
      }

      return (a.responseTimeMs || 0) - (b.responseTimeMs || 0);
    })[0];

  if (speedAlternative) {
    return [metadata.primary, speedAlternative];
  }

  if (FORCE_SPEED_480_EPISODE_IDS.has(canonicalId)) {
    const backupSpeedAlternative = (metadata.backupCandidates || [])
      .filter((entry) => entry.label === '480p')
      .filter((entry) => [200, 206].includes(entry.responseStatus))
      .filter((entry) => Number(entry.height || 0) > 0 && Number(entry.height || 0) <= 576)
      .sort((a, b) => {
        if ((b.healthScore || 0) !== (a.healthScore || 0)) {
          return (b.healthScore || 0) - (a.healthScore || 0);
        }

        return (a.responseTimeMs || 0) - (b.responseTimeMs || 0);
      })[0];

    if (backupSpeedAlternative) {
      const primaryStartupScore = metadata.primary.startupScore || metadata.primary.responseTimeMs || Infinity;
      const speedStartupScore = backupSpeedAlternative.startupScore || backupSpeedAlternative.responseTimeMs || Infinity;
      if (speedStartupScore < primaryStartupScore) {
        return [metadata.primary, backupSpeedAlternative];
      }
    }
  }

  return [metadata.primary];
}

function getTorrentSourceEntriesFromConfig(config) {
  if (!config) {
    return [];
  }

  if (Array.isArray(config)) {
    return config;
  }

  if (Array.isArray(config.sources)) {
    return config.sources;
  }

  return [];
}

function normalizeTorrentSourceEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const fileIdx = Number.isInteger(entry.fileIdx) ? entry.fileIdx : Number(entry.fileIdx);
  const normalized = {
    canonicalId: entry.canonicalId,
    title: entry.title,
    type: entry.type,
    quality: entry.quality,
    infoHash: typeof entry.infoHash === 'string' ? entry.infoHash.toLowerCase() : null,
    fileIdx,
    name: entry.name,
    seeders: entry.seeders,
    trackers: Array.isArray(entry.trackers) ? entry.trackers : [],
    sources: Array.isArray(entry.sources) ? entry.sources : [],
    confidence: entry.confidence,
    subtitleCompatibility: entry.subtitleCompatibility,
    subtitleFile: entry.subtitleFile,
    subtitleUrl: entry.subtitleUrl
  };

  if (!normalized.canonicalId || !/^S\d{2}E\d{2}$/.test(normalized.canonicalId)) {
    return null;
  }

  if (normalized.type !== 'torrent') {
    return null;
  }

  if (!/^[a-f0-9]{40}$/.test(normalized.infoHash || '')) {
    return null;
  }

  if (!Number.isInteger(normalized.fileIdx) || normalized.fileIdx < 0) {
    return null;
  }

  if (!TORRENT_QUALITY_RANK[normalized.quality]) {
    return null;
  }

  if (!TORRENT_CONFIDENCE_RANK[normalized.confidence] || normalized.confidence === 'low') {
    return null;
  }

  if (
    normalized.subtitleCompatibility !== 'matches-current-archive-timing'
    && !(normalized.subtitleCompatibility === 'needs-different-subtitle' && (normalized.subtitleFile || normalized.subtitleUrl))
  ) {
    return null;
  }

  return normalized;
}

function buildTorrentSourceMap() {
  const mergedEntries = [
    ...getTorrentSourceEntriesFromConfig(torrentSources),
    ...getTorrentSourceEntriesFromConfig(torrentSourcesLocal)
  ];

  const deduped = new Map();
  for (const entry of mergedEntries) {
    const normalized = normalizeTorrentSourceEntry(entry);
    if (!normalized) {
      continue;
    }

    const key = [normalized.canonicalId, normalized.quality, normalized.infoHash, normalized.fileIdx].join('|');
    deduped.set(key, normalized);
  }

  const grouped = new Map();
  for (const entry of deduped.values()) {
    const list = grouped.get(entry.canonicalId) || [];
    list.push(entry);
    grouped.set(entry.canonicalId, list);
  }

  for (const [canonicalId, list] of grouped.entries()) {
    list.sort((a, b) => {
      const qualityDiff = (TORRENT_QUALITY_RANK[b.quality] || 0) - (TORRENT_QUALITY_RANK[a.quality] || 0);
      if (qualityDiff !== 0) {
        return qualityDiff;
      }

      return (TORRENT_CONFIDENCE_RANK[b.confidence] || 0) - (TORRENT_CONFIDENCE_RANK[a.confidence] || 0);
    });
    grouped.set(canonicalId, list);
  }

  return grouped;
}

const TORRENT_SOURCE_MAP = buildTorrentSourceMap();

function isEpisodeSlowOrProblematic(episode) {
  const metadata = getEpisodeStreamMetadata(episode);
  const primary = metadata?.primary;
  if (!primary) {
    return false;
  }

  return primary.speedCategory === 'SLOW'
    || (primary.healthScore || 0) <= 90
    || (primary.startupScore || Infinity) >= 1500;
}

function getTorrentFallbackForEpisode(episode) {
  const canonicalId = getEpisodeKey(episode);
  if (!canonicalId || !isEpisodeSlowOrProblematic(episode)) {
    return null;
  }

  const options = TORRENT_SOURCE_MAP.get(canonicalId) || [];
  return options[0] || null;
}

function buildTrackerSources(entry) {
  return [...new Set(
    (Array.isArray(entry?.trackers) ? entry.trackers : [])
      .filter((tracker) => typeof tracker === 'string' && tracker.trim())
      .map((tracker) => {
        const value = tracker.trim();
        if (value.startsWith('tracker:') || value.startsWith('dht:')) {
          return value;
        }
        return `tracker:${value}`;
      })
  )];
}

function buildTorrentFallbackStream(entry, subtitles) {
  const stream = {
    name: 'Torrent Fallback',
    description: `Whoniverse Arabic • fallback only • ${entry.quality} • subtitles: English + Arabic`,
    infoHash: entry.infoHash,
    fileIdx: entry.fileIdx,
    behaviorHints: {
      notWebReady: true
    },
    subtitles
  };

  const trackerSources = buildTrackerSources(entry);
  if (trackerSources.length > 0) {
    stream.sources = trackerSources;
  }

  return stream;
}

function buildStreamLabel(streamEntry) {
  const prefix = streamEntry.label === '480p' ? '480p Speed' : '1080p Quality';
  if (!streamEntry.sizeLabel) {
    return prefix;
  }
  return `${prefix} • ${streamEntry.sizeLabel}`;
}

function buildStreamDescription(streamEntry, episode) {
  const parts = ['Whoniverse Arabic'];

  if (isSpecialEpisode(episode)) {
    parts.push('Special episode');
  }

  parts.push(streamEntry.label === '480p' ? 'Speed' : 'Quality');
  parts.push(`Source health ${streamEntry.healthScore || 0}/100`);
  parts.push('Subtitles: English + Arabic');

  return parts.join(' • ');
}

function buildStreamsForEpisode(episode) {
  if (!episode || !episode.streamUrl) {
    return [];
  }

  const subtitles = getSubtitleTracks(episode);
  const metadataBackedStreams = getMetadataBackedStreams(episode);

  if (metadataBackedStreams.length > 0) {
    const streams = metadataBackedStreams.map((streamEntry) => {
      const stream = {
        url: shouldUseDynamicRedirect(episode, streamEntry)
          ? buildVideoRedirectUrl(episode, streamEntry.label)
          : streamEntry.url,
        name: buildStreamLabel(streamEntry),
        description: buildStreamDescription(streamEntry, episode),
        subtitles
      };

      const bytes = getStreamBytes(streamEntry);
      if (bytes !== null) {
        stream.bytes = bytes;
      }

      return stream;
    });

    const torrentFallback = SHOW_TORRENT_FALLBACK ? getTorrentFallbackForEpisode(episode) : null;
    if (torrentFallback) {
      streams.push(buildTorrentFallbackStream(torrentFallback, subtitles));
    }

    return streams;
  }

  return [
    {
      url: episode.streamUrl,
      name: '1080p Quality',
      description: isSpecialEpisode(episode) ? 'Whoniverse Arabic • Special episode • Quality' : 'Whoniverse Arabic • Quality',
      subtitles
    }
  ];
}

function getManifestUrl() {
  return `${PUBLIC_ADDON_BASE_URL}/manifest.json`;
}

function getReviewSubtitleCount() {
  if (!fs.existsSync(REVIEW_SUBTITLE_DIR)) {
    return 0;
  }

  return fs.readdirSync(REVIEW_SUBTITLE_DIR).filter((name) => /\.srt$/i.test(name)).length;
}

function getArabicAlternativeEpisodeCount() {
  return Object.keys(ARABIC_ALT_INDEX).length;
}

function getStreamCounts() {
  const stream480p = allNewWhoEpisodes.reduce((count, episode) => {
    const metadataBackedStreams = getMetadataBackedStreams(episode);
    return count + (metadataBackedStreams.some((entry) => entry.label === '480p') ? 1 : 0);
  }, 0);

  const dynamicRedirectStreamCount = allNewWhoEpisodes.reduce((count, episode) => {
    const metadataBackedStreams = getMetadataBackedStreams(episode);
    return count + metadataBackedStreams.filter((entry) => shouldUseDynamicRedirect(episode, entry)).length;
  }, 0);

  const torrentFallbackEpisodes = new Set();
  const torrentFallbackCount = SHOW_TORRENT_FALLBACK
    ? allNewWhoEpisodes.reduce((count, episode) => {
      const fallback = getTorrentFallbackForEpisode(episode);
      if (!fallback) {
        return count;
      }

      torrentFallbackEpisodes.add(getEpisodeKey(episode));
      return count + 1;
    }, 0)
    : 0;

  return {
    episodes: Object.keys(STREAM_METADATA_EPISODES).length,
    stream1080p: STREAM_SUMMARY.episodesWith1080p || 0,
    stream480p,
    stream720p: STREAM_SUMMARY.episodesWith720pAdded || 0,
    fastStartBackups: STREAM_SUMMARY.episodesWithFastStartBackup || 0,
    dynamicRedirectStreamCount,
    torrentFallbackCount,
    episodesWithTorrentFallback: torrentFallbackEpisodes.size,
    torrentFallbackRejectedCount: Number(TORRENT_FALLBACK_AUDIT_SUMMARY.rejectedCount || 0)
  };
}

function jsonResponse(res, statusCode, payload) {
  sendCorsHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function getStremioInstallUrl() {
  const manifestUrl = new URL(getManifestUrl());
  return `stremio://${manifestUrl.host}${manifestUrl.pathname}${manifestUrl.search}`;
}

function renderHtmlPage(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(title)}</title>
  <style>
    :root{color-scheme:dark}
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;line-height:1.5}
    main{max-width:960px;margin:0 auto}
    a{color:#93c5fd}
    h1,h2,h3{margin:0 0 12px}
    p{margin:0 0 12px}
    .card{background:#111827;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,.2)}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}
    .button,.ghost-button,button{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:12px;font-weight:600;border:1px solid transparent;cursor:pointer;text-decoration:none;font-size:14px}
    .button{background:#2563eb;color:white}
    .ghost-button{background:#1f2937;color:#e2e8f0;border-color:#334155}
    .button:hover,.ghost-button:hover,button:hover{filter:brightness(1.06)}
    code,textarea,input,select{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    textarea,input,select{width:100%;background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:12px;box-sizing:border-box}
    textarea{min-height:160px;resize:vertical}
    .muted{color:#94a3b8}
    .small{font-size:13px}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .field{display:flex;flex-direction:column;gap:8px}
    .field label{font-size:13px;font-weight:600;color:#cbd5e1}
    .stack{display:flex;flex-direction:column;gap:14px}
    .manifest-box{background:#020617;border:1px solid #334155;border-radius:12px;padding:12px;word-break:break-all}
    .pill{display:inline-flex;align-items:center;background:#0b1220;border:1px solid #334155;color:#cbd5e1;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600}
    details{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:12px}
    details summary{cursor:pointer;font-weight:600}
    .status-note{min-height:20px;color:#93c5fd;font-size:13px}
    @media (max-width: 720px){body{padding:16px}.card{padding:18px}.grid{grid-template-columns:1fr}.actions{flex-direction:column}.button,.ghost-button,button{width:100%}}
  </style>
</head>
<body>
  <main>${body}</main>
</body>
</html>`;
}

function renderHomePage() {
  const streamCounts = getStreamCounts();
  const manifestUrl = getManifestUrl();
  const installUrl = getStremioInstallUrl();
  const altCount = getArabicAlternativeEpisodeCount();
  return renderHtmlPage(
    manifest.name,
    `<div class="card">
      <h1>Whoniverse Arabic 1080p</h1>
      <p><strong>Status:</strong> online</p>
      <p class="small muted">English and Arabic subtitles are separate selectable tracks.</p>
      <p class="small muted">Use 1080p for quality or 480p for speed.</p>
      <div class="actions">
        <a id="installButton" class="button" href="${htmlEscape(installUrl)}">Install in Stremio</a>
        <button id="copyManifestButton" class="ghost-button" type="button">Copy Manifest URL</button>
        <a class="ghost-button" href="${htmlEscape(REPORT_PATH)}">Report Subtitle Issue</a>
      </div>
      <p class="status-note" id="installStatus"></p>
      <div class="manifest-box"><strong>Manifest URL:</strong><br>${htmlEscape(manifestUrl)}</div>
    </div>
    <div class="card">
      <h2>Current Production Counts</h2>
      <ul>
        <li>Episode entries: ${allNewWhoEpisodes.length}</li>
        <li>Arabic subtitles: ${ARABIC_SUBTITLE_FILES.size}</li>
        <li>Arabic Alt coverage: ${altCount}</li>
        <li>1080p stream entries: ${streamCounts.stream1080p}</li>
        <li>480p speed entries: ${streamCounts.stream480p}</li>
        <li>Dynamic mirror redirect streams: ${streamCounts.dynamicRedirectStreamCount}</li>
        <li>Manual review subtitles still visible: ${SUBTITLE_STATUS_SUMMARY.manual_review || 0}</li>
      </ul>
      <p class="muted">If Arabic looks delayed or wrong, keep it selected and report the exact episode and timestamp from the report page.</p>
    </div>
    <script>
      (() => {
        const manifestUrl = ${serializeForScript(manifestUrl)};
        const installUrl = ${serializeForScript(installUrl)};
        const installButton = document.getElementById('installButton');
        const copyButton = document.getElementById('copyManifestButton');
        const status = document.getElementById('installStatus');

        function setStatus(message) {
          status.textContent = message;
        }

        installButton.addEventListener('click', (event) => {
          event.preventDefault();
          setStatus('Trying to open Stremio...');
          window.location.href = installUrl;
          window.setTimeout(() => {
            setStatus('If Stremio did not open, use Copy Manifest URL and paste it into Stremio.');
          }, 1200);
        });

        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(manifestUrl);
            setStatus('Manifest URL copied. Paste it into Stremio if direct install does not open.');
          } catch {
            setStatus('Copy failed. Use the visible manifest URL below.');
          }
        });
      })();
    </script>`
  );
}

function renderReportPage() {
  const reportEpisodes = allNewWhoEpisodes.map((episode) => ({
    season: episode.season,
    episode: episode.episode,
    title: episode.title,
    canonicalId: getEpisodeKey(episode)
  }));
  return renderHtmlPage(
    'Report Subtitle Issue',
    `<div class="card">
      <h1>Report a Subtitle Issue</h1>
      <p class="muted">Arabic subtitles stay visible even when they are under review. Fill the form and we will open a prefilled GitHub issue for you.</p>
      <form id="reportForm" class="stack">
        <div class="grid">
          <div class="field">
            <label for="seasonSelect">Season</label>
            <select id="seasonSelect" required></select>
          </div>
          <div class="field">
            <label for="episodeSelect">Episode</label>
            <select id="episodeSelect" required></select>
          </div>
        </div>
        <div class="field">
          <label for="episodeTitle">Episode title</label>
          <input id="episodeTitle" type="text" readonly>
        </div>
        <div class="grid">
          <div class="field">
            <label for="subtitleLanguage">Subtitle language</label>
            <select id="subtitleLanguage">
              <option>Arabic</option>
              <option>English</option>
            </select>
          </div>
          <div class="field">
            <label for="problemType">Problem type</label>
            <select id="problemType">
              <option>Arabic delay</option>
              <option>Arabic text garbled</option>
              <option>Wrong episode subtitle</option>
              <option>Missing Arabic</option>
              <option>Arabic Alt issue</option>
              <option>Stream too slow</option>
              <option>Stream won’t start</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label for="timestampInput">Approximate timestamp</label>
            <input id="timestampInput" type="text" placeholder="e.g. 00:14:22">
          </div>
          <div class="field">
            <label for="deviceSelect">Device</label>
            <select id="deviceSelect">
              <option>Windows</option>
              <option>Android phone</option>
              <option>Android TV / TV box</option>
              <option>Web</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div class="grid">
          <div class="field">
            <label for="qualitySelect">Stream quality used</label>
            <select id="qualitySelect">
              <option>1080p</option>
              <option>480p</option>
            </select>
          </div>
          <div class="field">
            <label for="notesInput">Notes</label>
            <input id="notesInput" type="text" placeholder="Short summary or symptom">
          </div>
        </div>
        <div class="field">
          <label for="detailsInput">Extra details</label>
          <textarea id="detailsInput" placeholder="Anything else that helps reproduce the issue"></textarea>
        </div>
        <div class="actions">
          <button class="button" type="submit">Open Prefilled GitHub Issue</button>
        </div>
        <p class="status-note" id="reportStatus"></p>
      </form>
    </div>
    <div class="card">
      <details>
        <summary>Advanced / Manual</summary>
        <p class="small muted">If the GitHub page does not open correctly, copy this template manually.</p>
        <textarea id="manualTemplate" readonly></textarea>
      </details>
    </div>
    <script>
      (() => {
        const episodes = ${serializeForScript(reportEpisodes)};
        const seasonSelect = document.getElementById('seasonSelect');
        const episodeSelect = document.getElementById('episodeSelect');
        const episodeTitle = document.getElementById('episodeTitle');
        const subtitleLanguage = document.getElementById('subtitleLanguage');
        const problemType = document.getElementById('problemType');
        const timestampInput = document.getElementById('timestampInput');
        const deviceSelect = document.getElementById('deviceSelect');
        const qualitySelect = document.getElementById('qualitySelect');
        const notesInput = document.getElementById('notesInput');
        const detailsInput = document.getElementById('detailsInput');
        const manualTemplate = document.getElementById('manualTemplate');
        const reportStatus = document.getElementById('reportStatus');
        const form = document.getElementById('reportForm');
        const issueBase = ${serializeForScript(GITHUB_ISSUE_TEMPLATE_URL)};

        const seasons = [...new Set(episodes.map((entry) => entry.season))].sort((a, b) => a - b);
        for (const season of seasons) {
          const option = document.createElement('option');
          option.value = season;
          option.textContent = 'Season ' + season;
          seasonSelect.appendChild(option);
        }

        function getSelectedEpisode() {
          return episodes.find((entry) => entry.canonicalId === episodeSelect.value) || null;
        }

        function buildIssueBody() {
          const selected = getSelectedEpisode();
          return [
            'Season: ' + (selected ? selected.season : ''),
            'Episode: ' + (selected ? selected.episode : ''),
            'Episode title: ' + (selected ? selected.title : ''),
            'Subtitle language: ' + subtitleLanguage.value,
            'Problem type: ' + problemType.value,
            'Approximate timestamp: ' + timestampInput.value,
            'Device: ' + deviceSelect.value,
            'Stream quality used: ' + qualitySelect.value,
            'Notes: ' + notesInput.value,
            '',
            detailsInput.value.trim()
          ].join('\n');
        }

        function updateEpisodeOptions() {
          const season = Number(seasonSelect.value);
          const relevant = episodes.filter((entry) => entry.season === season);
          episodeSelect.innerHTML = '';
          for (const entry of relevant) {
            const option = document.createElement('option');
            option.value = entry.canonicalId;
            option.textContent = 'E' + String(entry.episode).padStart(2, '0') + ' • ' + entry.title;
            episodeSelect.appendChild(option);
          }
          updateSelectedEpisode();
        }

        function updateSelectedEpisode() {
          const selected = getSelectedEpisode();
          episodeTitle.value = selected ? selected.title : '';
          manualTemplate.value = buildIssueBody();
        }

        seasonSelect.addEventListener('change', updateEpisodeOptions);
        episodeSelect.addEventListener('change', updateSelectedEpisode);
        [subtitleLanguage, problemType, timestampInput, deviceSelect, qualitySelect, notesInput, detailsInput].forEach((element) => {
          element.addEventListener('input', updateSelectedEpisode);
          element.addEventListener('change', updateSelectedEpisode);
        });

        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const selected = getSelectedEpisode();
          const issueTitle = selected
            ? 'Subtitle issue: ' + selected.canonicalId + ' - ' + selected.title
            : 'Subtitle issue';
          const issueBody = buildIssueBody();
          const target = issueBase + '&title=' + encodeURIComponent(issueTitle) + '&body=' + encodeURIComponent(issueBody);
          reportStatus.textContent = 'Opening GitHub issue page...';
          window.open(target, '_blank', 'noopener');
        });

        seasonSelect.value = String(seasons[0] || '1');
        updateEpisodeOptions();
      })();
    </script>`
  );
}

function serveStaticAsset(req, res, filename) {
  const assetPath = getAssetFilePath(filename);
  if (!fs.existsSync(assetPath)) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Asset not found');
    return;
  }

  const extension = path.extname(assetPath).toLowerCase();
  const contentType = extension === '.svg'
    ? 'image/svg+xml; charset=utf-8'
    : extension === '.png'
      ? 'image/png'
      : extension === '.jpg' || extension === '.jpeg'
        ? 'image/jpeg'
        : 'application/octet-stream';

  sendCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(assetPath).pipe(res);
}

builder.defineCatalogHandler(async (args) => {
  if (args.type === 'series' && args.id === manifest.catalogs[0].id) {
    return {
      metas: [
        {
          id: NEW_WHO_SERIES_STREMIO_ID,
          type: 'series',
          name: 'New Who 1080p',
          poster: NEW_WHO_SERIES_POSTER_URL,
          description: 'Doctor Who from 2005 onward with separate English and Arabic subtitle tracks plus simple 1080p quality and 480p speed stream choices.',
          logo: ADDON_LOGO_URL,
          genres: ['Sci-Fi', 'Adventure', 'Drama'],
          releaseInfo: '2005-Present'
        }
      ]
    };
  }

  return { metas: [] };
});

builder.defineMetaHandler(async (args) => {
  if (args.type === 'series' && args.id === NEW_WHO_SERIES_STREMIO_ID) {
    return {
      meta: {
        id: NEW_WHO_SERIES_STREMIO_ID,
        type: 'series',
        name: 'New Who 1080p',
        poster: NEW_WHO_SERIES_POSTER_URL,
        background: NEW_WHO_SERIES_BACKGROUND_URL,
        logo: ADDON_LOGO_URL,
        description: 'Doctor Who from 2005 onward in broadcast order, with separate English and Arabic subtitle options plus audited 1080p quality and 480p speed streams.',
        releaseInfo: '2005-Present',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        videos: allNewWhoEpisodes.map((ep) => ({
          id: `${NEW_WHO_SERIES_STREMIO_ID}:${ep.season}:${ep.episode}`,
          title: ep.title,
          season: ep.season,
          episode: ep.episode,
          released: ep.released,
          overview: ep.overview,
          thumbnail: ep.thumbnail || ADDON_LOGO_URL,
          available: Boolean(ep.streamUrl)
        }))
      }
    };
  }

  return { meta: null };
});

builder.defineStreamHandler(async (args) => {
  if (args.type !== 'series' || !args.id) {
    return { streams: [] };
  }

  const episode = getEpisodeFromArgs(args.id);
  return { streams: buildStreamsForEpisode(episode) };
});

builder.defineSubtitlesHandler(async (args) => {
  if (args.type !== 'series' || !args.id) {
    return { subtitles: [] };
  }

  const episode = getEpisodeFromArgs(args.id);
  return { subtitles: getSubtitleTracks(episode) };
});

const addonRouter = getRouter(builder.getInterface());

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
}

function serveArabicSubtitle(req, res, filename) {
  const safeName = path.basename(filename);

  if (!safeName || !ARABIC_SUBTITLE_FILES.has(safeName)) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Subtitle not found');
    return;
  }

  const subtitlePath = getArabicSubtitleFilePath(safeName);
  if (!fs.existsSync(subtitlePath)) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Subtitle file missing');
    return;
  }

  sendCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-subrip; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(subtitlePath).pipe(res);
}

function serveArabicAltSubtitle(req, res, filename) {
  const safeName = path.basename(filename);
  const filePath = getArabicAltSubtitleFilePath(safeName);
  if (!safeName || !fs.existsSync(filePath)) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Subtitle alternative not found');
    return;
  }

  sendCorsHeaders(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-subrip; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `127.0.0.1:${port}`}`);

  if (requestUrl.pathname === '/') {
    sendCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderHomePage());
    return;
  }

  if (requestUrl.pathname === REPORT_PATH) {
    sendCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderReportPage());
    return;
  }

  if (requestUrl.pathname === '/healthz') {
    const streamCounts = getStreamCounts();
    jsonResponse(res, 200, {
      status: 'ok',
      name: manifest.name,
      version: manifest.version,
      manifest: getManifestUrl(),
      episodes: allNewWhoEpisodes.length,
      arabicSubtitles: ARABIC_SUBTITLE_FILES.size,
      streams: streamCounts.episodes
    });
    return;
  }

  if (requestUrl.pathname === '/status') {
    const streamCounts = getStreamCounts();
    const arabicAltCount = getArabicAlternativeEpisodeCount();
    jsonResponse(res, 200, {
      name: manifest.name,
      version: manifest.version,
      episodeCount: allNewWhoEpisodes.length,
      arabicSubtitleCount: ARABIC_SUBTITLE_FILES.size,
      arabicPrimaryCount: ARABIC_SUBTITLE_FILES.size,
      arabicAlternativeCount: arabicAltCount,
      episodesMissingArabicAlternatives: ARABIC_SUBTITLE_FILES.size - arabicAltCount,
      stream1080pCount: streamCounts.stream1080p,
      stream480pCount: streamCounts.stream480p,
      dynamicRedirectStreamCount: streamCounts.dynamicRedirectStreamCount,
      torrentFallbackCount: streamCounts.torrentFallbackCount,
      episodesWithTorrentFallback: streamCounts.episodesWithTorrentFallback,
      torrentFallbackRejectedCount: streamCounts.torrentFallbackRejectedCount,
      subtitleCacheBusting: true,
      manualReviewSubtitleCount: SUBTITLE_STATUS_SUMMARY.manual_review || 0,
      reviewFolderCount: getReviewSubtitleCount(),
      subtitleStatusSummary: SUBTITLE_STATUS_SUMMARY,
      streamHealthSummary: STREAM_SUMMARY.primary || {},
      deploymentBaseUrl: PUBLIC_ADDON_BASE_URL,
      manifest: getManifestUrl()
    });
    return;
  }

  if (requestUrl.pathname.startsWith(`${ASSET_ROUTE}/`)) {
    if (req.method === 'OPTIONS') {
      sendCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    const encodedName = requestUrl.pathname.slice(`${ASSET_ROUTE}/`.length);
    serveStaticAsset(req, res, decodeURIComponent(encodedName));
    return;
  }

  if (requestUrl.pathname.startsWith(`${VIDEO_ROUTE}/`)) {
    if (req.method === 'OPTIONS') {
      sendCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    const segments = requestUrl.pathname.slice(`${VIDEO_ROUTE}/`.length).split('/').filter(Boolean);
    if (segments.length >= 2) {
      void redirectDynamicStream(req, res, decodeURIComponent(segments[0]), decodeURIComponent(segments[1]));
      return;
    }
  }

  if (requestUrl.pathname.startsWith(`${ARABIC_ALT_SUBTITLE_ROUTE}/`)) {
    if (req.method === 'OPTIONS') {
      sendCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    const encodedName = requestUrl.pathname.slice(`${ARABIC_ALT_SUBTITLE_ROUTE}/`.length);
    serveArabicAltSubtitle(req, res, decodeURIComponent(encodedName));
    return;
  }

  if (requestUrl.pathname.startsWith(`${ARABIC_SUBTITLE_ROUTE}/`)) {
    if (req.method === 'OPTIONS') {
      sendCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    const encodedName = requestUrl.pathname.slice(`${ARABIC_SUBTITLE_ROUTE}/`.length);
    serveArabicSubtitle(req, res, decodeURIComponent(encodedName));
    return;
  }

  addonRouter(req, res, () => {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ err: 'not found' }));
  });
});

server.listen(port, host, () => {
  console.log(`Whoniverse Addon active on http://${host}:${port}`);
  console.log(`Install URL: ${getManifestUrl()}`);
  console.log(`Arabic subtitles served from: ${PUBLIC_ADDON_BASE_URL}${ARABIC_SUBTITLE_ROUTE}/<filename>`);
});
