const fs = require('fs');
const http = require('http');
const path = require('path');
const QRCode = require('qrcode');
const { addonBuilder, getRouter } = require('stremio-addon-sdk');
const { CATALOGS, CONTENT_IDS, createContentLibrary } = require('./contentLibrary');
const { buildEpisodeTagLine, buildEpisodeTagMetadata, formatEpisodeTagLabel } = require('./episodeTagMetadata');
const { createStreamRegistry } = require('./streamRegistry');
const { createSubtitleRegistry } = require('./subtitleRegistry');
const {
  TORCHWOOD_EPISODE_TAGS,
  buildTorchwoodEpisodeOverview,
  buildTorchwoodEpisodeTagLine
} = require('./torchwoodEpisodeTags');
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
const arabicImprovedSubtitles = loadJsonFile('arabicImprovedSubtitles.json', {});
const episodeTags = loadJsonFile('episodeTags.json', {});
const streamMetadata = loadJsonFile('streamMetadata.json', { episodes: {}, summary: {} });
const subtitleStatus = loadJsonFile('subtitleStatus.json', { entries: {}, summary: {} });
const torrentSources = loadJsonFile('torrentSources.json', { sources: [] });
const torrentSourcesLocal = loadJsonFile('torrentSources.local.json', { sources: [] });
const torrentFallbackAudit = loadJsonFile('audit/torrent-fallback-audit.json', { summary: {} });

const NEW_WHO_SERIES_STREMIO_ID = CONTENT_IDS.newWho;
const TORCHWOOD_SERIES_STREMIO_ID = CONTENT_IDS.torchwood;
const DOCTOR_WHO_MOVIE_1996_STREMIO_ID = CONTENT_IDS.doctorWhoMovie1996;
const EPISODE_TAGS = episodeTags || {};
const STREAM_METADATA_EPISODES = streamMetadata.episodes || {};
const STREAM_SUMMARY = streamMetadata.summary || {};
const SUBTITLE_STATUS_ENTRIES = subtitleStatus.entries || {};
const SUBTITLE_STATUS_SUMMARY = subtitleStatus.summary || {};
const TORRENT_FALLBACK_AUDIT_SUMMARY = torrentFallbackAudit.summary || {};
const ASSET_DIR = path.join(__dirname, 'assets');
const ASSET_ROUTE = '/assets';
const VIDEO_ROUTE = '/video';
const port = Number(process.env.PORT) || 7000;
const host = process.env.HOST || '0.0.0.0';
const REPORT_PATH = '/report';
const LIBRARY_PATH = '/library';
const INSTALL_PATH = '/install';
const REVIEW_SUBTITLE_DIR = path.join(__dirname, 'review', 'arabic-subtitles');
const GITHUB_ISSUE_TEMPLATE_URL = 'https://github.com/mohammadhaddad11/doctor-who-arabic/issues/new?template=subtitle-issue.md';
const MIRROR_CACHE_TTL_MS = 15 * 60 * 1000;
const MIRROR_PROBE_TIMEOUT_MS = 2200;
const MIRROR_PROBE_MAX_CANDIDATES = 3;
const DEFAULT_ADDON_LOGO_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const LOCAL_ADDON_LOGO_FILE = path.join(ASSET_DIR, 'whoniverse-arabic-logo.svg');
const SEASON_5_THUMBNAIL_BASE_URL = 'https://dn600308.us.archive.org/0/items/nw_S05';

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
const CONTENT_LIBRARY = createContentLibrary({
  addonLogoUrl: ADDON_LOGO_URL,
  assetBaseUrl: `${PUBLIC_ADDON_BASE_URL}${ASSET_ROUTE}`
});
const NEW_WHO_SERIES = CONTENT_LIBRARY.getSeriesById(NEW_WHO_SERIES_STREMIO_ID);
const TORCHWOOD_SERIES = CONTENT_LIBRARY.getSeriesById(TORCHWOOD_SERIES_STREMIO_ID);
const DOCTOR_WHO_MOVIE_1996 = CONTENT_LIBRARY.getMovieById(DOCTOR_WHO_MOVIE_1996_STREMIO_ID);
const allNewWhoEpisodesPreSorted = NEW_WHO_SERIES.episodes;
const torchwoodEpisodes = TORCHWOOD_SERIES.episodes;
const subtitleRegistry = createSubtitleRegistry({
  rootDir: __dirname,
  publicBaseUrl: PUBLIC_ADDON_BASE_URL,
  primaryArabicFiles: arabicSubtitleFiles,
  arabicAlternativeIndex: arabicSubtitleAlternatives,
  arabicImprovedIndex: arabicImprovedSubtitles,
  movie: DOCTOR_WHO_MOVIE_1996
});

function buildCatalogMeta(entry) {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    poster: entry.poster,
    description: entry.catalogDescription,
    ...(entry.logo ? { logo: entry.logo } : {}),
    genres: [...entry.genres],
    releaseInfo: entry.releaseInfo
  };
}

function buildTitleMeta(entry) {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    poster: entry.poster,
    background: entry.background,
    ...(entry.logo ? { logo: entry.logo } : {}),
    description: entry.description,
    releaseInfo: entry.releaseInfo,
    genres: [...entry.genres]
  };
}

const manifest = {
  id: 'community.mhaddad.whoniverse.arabic',
  version: '1.7.1',
  name: 'Whoniverse Arabic 1080p',
  description: 'Doctor Who and Torchwood in broadcast order with curated HD streams and selectable subtitle tracks where available.',
  logo: ADDON_LOGO_URL,
  types: ['series', 'movie'],
  resources: ['catalog', 'meta', 'stream', 'subtitles'],
  catalogs: [{ ...CATALOGS.series }, { ...CATALOGS.movies }],
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

function getTorchwoodEpisodeFromArgs(id) {
  const [seriesId, seasonStr, episodeStr] = id.split(':');

  if (seriesId !== TORCHWOOD_SERIES_STREMIO_ID) {
    return null;
  }

  const season = Number.parseInt(seasonStr, 10);
  const episodeNum = Number.parseInt(episodeStr, 10);

  return torchwoodEpisodes.find((episode) => episode.season === season && episode.episode === episodeNum) || null;
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

function getEpisodeThumbnail(episode) {
  if (!episode?.thumbnail) {
    return ADDON_LOGO_URL;
  }

  if (episode.season === 5) {
    const thumbnailFile = episode.thumbnail.split('/').pop();
    return thumbnailFile ? `${SEASON_5_THUMBNAIL_BASE_URL}/${thumbnailFile}` : ADDON_LOGO_URL;
  }

  return episode.thumbnail;
}

function getAssetFilePath(assetName) {
  return path.join(ASSET_DIR, path.basename(assetName));
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

function getManifestUrl() {
  return `${PUBLIC_ADDON_BASE_URL}/manifest.json`;
}

function getReviewSubtitleCount() {
  if (!fs.existsSync(REVIEW_SUBTITLE_DIR)) {
    return 0;
  }

  return fs.readdirSync(REVIEW_SUBTITLE_DIR).filter((name) => /\.srt$/i.test(name)).length;
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

const streamRegistry = createStreamRegistry({
  getEpisodeKey,
  getMetadataBackedStreams,
  shouldUseDynamicRedirect,
  buildVideoRedirectUrl,
  getStreamBytes,
  getTorrentFallbackForEpisode,
  buildTrackerSources,
  showTorrentFallback: SHOW_TORRENT_FALLBACK,
  isSpecialEpisode,
  episodeTags: EPISODE_TAGS,
  buildEpisodeTagLine,
  subtitleRegistry
});

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
    .hero{background:linear-gradient(135deg,#172554 0%,#111827 55%,#0f172a 100%);border-color:#3b82f6}
    .eyebrow{color:#93c5fd;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    .content-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:24px}
    .content-grid.single{grid-template-columns:minmax(0,480px)}
    .content-card{background:#111827;border:1px solid #334155;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
    .content-card img{width:100%;aspect-ratio:16/10;object-fit:cover;background:#020617}
    .content-card-body{padding:18px;display:flex;flex-direction:column;flex:1}
    .content-card-body .actions{margin-top:auto;padding-top:8px}
    .meta-line{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
    .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:18px 0}
    .stat{background:#0b1220;border:1px solid #334155;border-radius:12px;padding:12px}
    .stat strong{display:block;color:#f8fafc;font-size:20px}
    .table-wrap{overflow-x:auto;border:1px solid #334155;border-radius:12px;margin:12px 0 20px}
    table{width:100%;border-collapse:collapse;min-width:900px;background:#0b1220}
    th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #253247;font-size:13px}
    th{background:#111827;color:#cbd5e1;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
    tr:last-child td{border-bottom:0}
    .episode-code{color:#93c5fd;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;white-space:nowrap}
    .badge-row{display:flex;gap:6px;flex-wrap:wrap}
    .badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:#172033;border:1px solid #334155;color:#cbd5e1;font-size:11px;white-space:nowrap}
    .yes{color:#86efac}.no{color:#fca5a5}
    .section-heading{display:flex;justify-content:space-between;align-items:end;gap:16px;margin:30px 0 14px}
    .section-heading p{margin:0}
    .qr-layout{display:grid;grid-template-columns:minmax(220px,340px) 1fr;gap:24px;align-items:center}
    .qr-code{display:block;width:100%;max-width:320px;background:#fff;border-radius:16px;padding:14px;box-sizing:border-box}
    .copy-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin:10px 0 18px}
    .copy-row input{min-width:0}
    @media (max-width: 720px){body{padding:16px}.card{padding:18px}.grid{grid-template-columns:1fr}.actions{flex-direction:column}.button,.ghost-button,button{width:100%}}
    @media (max-width: 900px){.content-grid{grid-template-columns:1fr}.content-card{display:grid;grid-template-columns:140px 1fr}.content-card img{height:100%;aspect-ratio:auto}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (max-width: 720px){.qr-layout{grid-template-columns:1fr}.qr-code{margin:0 auto}.copy-row{grid-template-columns:1fr}.content-card{display:flex}.content-card img{height:auto;aspect-ratio:16/9}.section-heading{display:block}.stats{grid-template-columns:1fr 1fr}}
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
  const altCount = subtitleRegistry.getArabicAlternativeEpisodeCount();
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
        <a class="ghost-button" href="${htmlEscape(INSTALL_PATH)}">QR Install</a>
        <a class="ghost-button" href="${htmlEscape(LIBRARY_PATH)}">Browse Library</a>
        <a class="ghost-button" href="${htmlEscape(REPORT_PATH)}">Report Subtitle Issue</a>
      </div>
      <p class="status-note" id="installStatus"></p>
      <div class="manifest-box"><strong>Manifest URL:</strong><br>${htmlEscape(manifestUrl)}</div>
    </div>
    <div class="card">
      <h2>Current Production Counts</h2>
      <ul>
        <li>Episode entries: ${allNewWhoEpisodes.length}</li>
        <li>Arabic subtitles: ${subtitleRegistry.primaryArabicCount}</li>
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

let installQrCache = null;

function getInstallQrDataUrl(installUrl) {
  if (!installQrCache || installQrCache.installUrl !== installUrl) {
    installQrCache = {
      installUrl,
      promise: QRCode.toDataURL(installUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: { dark: '#0f172a', light: '#ffffff' }
      })
    };
    installQrCache.promise.catch(() => {
      installQrCache = null;
    });
  }
  return installQrCache.promise;
}

async function renderInstallPage() {
  const manifestUrl = getManifestUrl();
  const installUrl = getStremioInstallUrl();
  const qrDataUrl = await getInstallQrDataUrl(installUrl);
  return renderHtmlPage(
    `Install · ${manifest.name}`,
    `<header class="card hero">
      <p class="eyebrow">Addon installation</p>
      <h1>Install Whoniverse Arabic 1080p</h1>
      <p>Scan the QR code on your Stremio device, open the install link directly, or copy the manifest URL.</p>
      <div class="actions">
        <a class="button" href="${htmlEscape(installUrl)}">Open in Stremio</a>
        <a class="ghost-button" href="${htmlEscape(LIBRARY_PATH)}">Browse Library</a>
        <a class="ghost-button" href="/status">Status</a>
        <a class="ghost-button" href="/">Home</a>
      </div>
    </header>
    <section class="card qr-layout">
      <div><img class="qr-code" src="${htmlEscape(qrDataUrl)}" alt="QR code for the Stremio install URL"></div>
      <div>
        <h2>Scan or Copy</h2>
        <p class="small muted">The QR code contains the Stremio install URL. No third-party QR service is contacted.</p>
        <label class="small" for="manifestUrl"><strong>Manifest URL</strong></label>
        <div class="copy-row"><input id="manifestUrl" value="${htmlEscape(manifestUrl)}" readonly><button class="ghost-button" type="button" data-copy="manifestUrl">Copy</button></div>
        <label class="small" for="installUrl"><strong>Stremio install URL</strong></label>
        <div class="copy-row"><input id="installUrl" value="${htmlEscape(installUrl)}" readonly><button class="ghost-button" type="button" data-copy="installUrl">Copy</button></div>
        <p id="copyStatus" class="status-note" aria-live="polite"></p>
      </div>
    </section>
    <script>
      document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
          const input = document.getElementById(button.dataset.copy);
          const status = document.getElementById('copyStatus');
          try {
            await navigator.clipboard.writeText(input.value);
            status.textContent = 'Link copied.';
          } catch {
            input.select();
            status.textContent = 'Select and copy the highlighted link.';
          }
        });
      });
    </script>`
  );
}

function renderLibraryContentCard(entry, { displayName, countLabel, subtitleSummary, catalogPath, streamPath = null }) {
  const metaPath = `/meta/${entry.type}/${encodeURIComponent(entry.id)}.json`;
  const streamLink = streamPath
    ? `<a class="ghost-button" href="${htmlEscape(streamPath)}">Streams</a>`
    : '';
  return `<article class="content-card">
    <img src="${htmlEscape(entry.background || entry.poster)}" alt="${htmlEscape(displayName)} artwork" loading="lazy">
    <div class="content-card-body">
      <p class="eyebrow">${htmlEscape(entry.type)}</p>
      <h3>${htmlEscape(displayName)}</h3>
      <div class="meta-line">
        <span class="pill">${htmlEscape(entry.releaseInfo)}</span>
        <span class="pill">${htmlEscape(countLabel)}</span>
      </div>
      <p class="small">${htmlEscape(entry.description)}</p>
      <p class="small muted"><strong>Subtitles:</strong> ${htmlEscape(subtitleSummary)}</p>
      <div class="actions">
        <a class="ghost-button" href="${htmlEscape(metaPath)}">Metadata</a>
        ${streamLink}
        <a class="ghost-button" href="${htmlEscape(catalogPath)}">Catalog</a>
      </div>
    </div>
  </article>`;
}

function renderTorchwoodEpisodeTable(season, episodes) {
  const rows = episodes.map((episode) => {
    const canonicalId = getEpisodeKey(episode);
    const tag = TORCHWOOD_EPISODE_TAGS[canonicalId];
    const playable = episode.streams.length > 0;
    const visibleTags = buildTorchwoodEpisodeTagLine(tag).match(/\[[^\]]+\]/g) || [];
    const badges = visibleTags
      .map((label) => `<span class="badge">${htmlEscape(label.slice(1, -1))}</span>`)
      .join('');
    const note = canonicalId === 'S01E02'
      ? 'Listed for continuity only — no playable stream'
      : tag?.comment || '';
    const streamPath = `/stream/series/${encodeURIComponent(TORCHWOOD_SERIES_STREMIO_ID)}:${episode.season}:${episode.episode}.json`;
    return `<tr>
      <td><span class="episode-code">${htmlEscape(canonicalId)}</span></td>
      <td><strong>${htmlEscape(episode.title)}</strong></td>
      <td class="${playable ? 'yes' : 'no'}">${playable ? 'Yes' : 'No'}</td>
      <td>${htmlEscape(formatEpisodeTagLabel(tag?.cleanStatus))}</td>
      <td><div class="badge-row">${badges}</div></td>
      <td>${htmlEscape(note)}</td>
      <td><a href="${htmlEscape(streamPath)}">Stream JSON</a></td>
    </tr>`;
  }).join('');

  return `<h3>Season ${season}</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Episode</th><th>Title</th><th>Playable</th><th>Source</th><th>Viewer tags</th><th>Note</th><th>Endpoint</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderLibraryPage() {
  const manifestUrl = getManifestUrl();
  const installUrl = getStremioInstallUrl();
  const improvedArabicCount = subtitleRegistry.getArabicImprovedEpisodeCount();
  const newWhoEnglishCount = allNewWhoEpisodes.filter((episode) => Boolean(episode.subtitleUrl)).length;
  const torchwoodPlayableCount = torchwoodEpisodes.filter((episode) => episode.streams.length > 0).length;
  const torchwoodCleanCount = TORCHWOOD_SERIES.notes.cleanCutEpisodeIds.length;
  const torchwoodOriginalCount = torchwoodPlayableCount - torchwoodCleanCount;
  const movieSubtitleAvailable = subtitleRegistry.getMovie1996Subtitles().length > 0;
  const seriesCatalogPath = `/catalog/${CATALOGS.series.type}/${encodeURIComponent(CATALOGS.series.id)}.json`;
  const movieCatalogPath = `/catalog/${CATALOGS.movies.type}/${encodeURIComponent(CATALOGS.movies.id)}.json`;
  const seasonTables = [...new Set(torchwoodEpisodes.map((episode) => episode.season))]
    .sort((a, b) => a - b)
    .map((season) => renderTorchwoodEpisodeTable(
      season,
      torchwoodEpisodes.filter((episode) => episode.season === season)
    ))
    .join('');

  const seriesCards = [
    renderLibraryContentCard(NEW_WHO_SERIES, {
      displayName: 'Doctor Who',
      countLabel: `${allNewWhoEpisodes.length} episodes`,
      subtitleSummary: `${newWhoEnglishCount} English tracks; ${subtitleRegistry.primaryArabicCount} Arabic tracks; ${improvedArabicCount} Arabic Improved tracks`,
      catalogPath: seriesCatalogPath
    }),
    renderLibraryContentCard(TORCHWOOD_SERIES, {
      displayName: 'Torchwood',
      countLabel: `${torchwoodPlayableCount}/${torchwoodEpisodes.length} playable`,
      subtitleSummary: 'Embedded English on original MKVs; external English on clean cuts; Arabic planned later',
      catalogPath: seriesCatalogPath
    })
  ].join('');
  const movieCard = renderLibraryContentCard(DOCTOR_WHO_MOVIE_1996, {
    displayName: DOCTOR_WHO_MOVIE_1996.name,
    countLabel: `${DOCTOR_WHO_MOVIE_1996.streams.length} stream`,
    subtitleSummary: movieSubtitleAvailable ? 'Arabic Improved available' : 'No local subtitle currently available',
    catalogPath: movieCatalogPath,
    streamPath: `/stream/movie/${encodeURIComponent(DOCTOR_WHO_MOVIE_1996_STREMIO_ID)}.json`
  });

  return renderHtmlPage(
    `Library · ${manifest.name}`,
    `<header class="card hero">
      <p class="eyebrow">Public addon library</p>
      <h1>Whoniverse Arabic 1080p</h1>
      <p>Browse the Doctor Who and Torchwood titles available through this addon without opening raw catalog data.</p>
      <div class="actions">
        <a class="button" href="${htmlEscape(installUrl)}">Install Addon</a>
        <a class="ghost-button" href="${htmlEscape(INSTALL_PATH)}">QR Install</a>
        <a class="ghost-button" href="${htmlEscape(manifestUrl)}">Manifest</a>
        <a class="ghost-button" href="/status">Status</a>
        <a class="ghost-button" href="/">Home</a>
      </div>
    </header>

    <div class="section-heading"><div><p class="eyebrow">Series</p><h2>Series Library</h2></div><p class="small muted">Two series in broadcast order</p></div>
    <div class="content-grid">${seriesCards}</div>

    <div class="section-heading"><div><p class="eyebrow">Movies</p><h2>Movie Library</h2></div><p class="small muted">One feature-length title</p></div>
    <div class="content-grid single">${movieCard}</div>

    <section class="card">
      <p class="eyebrow">Doctor Who</p>
      <h2>Doctor Who Summary</h2>
      <div class="stats">
        <div class="stat"><strong>${allNewWhoEpisodes.length}</strong><span class="small muted">Episodes</span></div>
        <div class="stat"><strong>${subtitleRegistry.primaryArabicCount}</strong><span class="small muted">Arabic tracks</span></div>
        <div class="stat"><strong>${improvedArabicCount}</strong><span class="small muted">Arabic Improved</span></div>
        <div class="stat"><strong>1</strong><span class="small muted">Movie</span></div>
      </div>
      <p class="muted">Doctor Who remains available in broadcast order with its existing stream choices and selectable subtitle tracks.</p>
      <div class="actions">
        <a class="ghost-button" href="/meta/series/${htmlEscape(NEW_WHO_SERIES_STREMIO_ID)}.json">Series Metadata</a>
        <a class="ghost-button" href="${htmlEscape(seriesCatalogPath)}">Series Catalog</a>
      </div>
    </section>

    <section class="card">
      <p class="eyebrow">Torchwood</p>
      <h2>Torchwood Summary</h2>
      <div class="stats">
        <div class="stat"><strong>${torchwoodEpisodes.length}</strong><span class="small muted">Total episodes</span></div>
        <div class="stat"><strong>${torchwoodPlayableCount}</strong><span class="small muted">Playable</span></div>
        <div class="stat"><strong>${torchwoodCleanCount}</strong><span class="small muted">Clean Cut</span></div>
        <div class="stat"><strong>${torchwoodOriginalCount}</strong><span class="small muted">Original MKV</span></div>
      </div>
      <p><strong>Non-playable:</strong> S01E02 only.</p>
      <p class="small muted"><strong>English subtitles:</strong> Original MKVs may contain embedded English subtitles. All clean-cut episodes have external English subtitles.</p>
      <p class="small muted"><strong>Arabic subtitles:</strong> Planned later, episode by episode; none are currently wired for Torchwood.</p>
    </section>

    <section>
      <div class="section-heading"><div><p class="eyebrow">Episode guide</p><h2>Torchwood Episodes</h2></div><p class="small muted">Grouped by season</p></div>
      ${seasonTables}
    </section>

    <section class="card">
      <p class="eyebrow">Movie</p>
      <h2>${htmlEscape(DOCTOR_WHO_MOVIE_1996.name)}</h2>
      <p>${htmlEscape(DOCTOR_WHO_MOVIE_1996.description)}</p>
      <p><strong>Stream:</strong> ${DOCTOR_WHO_MOVIE_1996.streams.length ? 'Available' : 'Unavailable'}</p>
      <p><strong>Arabic Improved:</strong> ${movieSubtitleAvailable ? 'Available' : 'Unavailable'}</p>
      <div class="actions">
        <a class="ghost-button" href="/meta/movie/${htmlEscape(DOCTOR_WHO_MOVIE_1996_STREMIO_ID)}.json">Movie Metadata</a>
        <a class="ghost-button" href="/stream/movie/${htmlEscape(DOCTOR_WHO_MOVIE_1996_STREMIO_ID)}.json">Movie Stream</a>
      </div>
    </section>`
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
  if (args.type === CATALOGS.series.type && args.id === CATALOGS.series.id) {
    return { metas: CONTENT_LIBRARY.series.map(buildCatalogMeta) };
  }

  if (args.type === CATALOGS.movies.type && args.id === CATALOGS.movies.id) {
    return { metas: CONTENT_LIBRARY.movies.map(buildCatalogMeta) };
  }

  return { metas: [] };
});

builder.defineMetaHandler(async (args) => {
  if (args.type === 'series' && args.id === NEW_WHO_SERIES_STREMIO_ID) {
    return {
      meta: {
        ...buildTitleMeta(NEW_WHO_SERIES),
        videos: allNewWhoEpisodes.map((ep) => {
          const tagMetadata = buildEpisodeTagMetadata(ep, EPISODE_TAGS[getEpisodeKey(ep)]);
          return {
            id: `${NEW_WHO_SERIES_STREMIO_ID}:${ep.season}:${ep.episode}`,
            title: ep.title,
            season: ep.season,
            episode: ep.episode,
            released: ep.released,
            overview: tagMetadata.overview,
            genres: tagMetadata.genres,
            thumbnail: getEpisodeThumbnail(ep),
            available: Boolean(ep.streamUrl)
          };
        })
      }
    };
  }

  if (args.type === 'series' && args.id === TORCHWOOD_SERIES_STREMIO_ID) {
    return {
      meta: {
        ...buildTitleMeta(TORCHWOOD_SERIES),
        videos: torchwoodEpisodes.map((episode) => {
          const tag = TORCHWOOD_EPISODE_TAGS[getEpisodeKey(episode)];
          return {
            id: `${TORCHWOOD_SERIES_STREMIO_ID}:${episode.season}:${episode.episode}`,
            title: episode.title,
            season: episode.season,
            episode: episode.episode,
            released: episode.released,
            overview: buildTorchwoodEpisodeOverview(episode, tag),
            thumbnail: episode.thumbnail,
            available: episode.streams.length > 0
          };
        })
      }
    };
  }

  if (args.type === 'movie' && args.id === DOCTOR_WHO_MOVIE_1996_STREMIO_ID) {
    return { meta: buildTitleMeta(DOCTOR_WHO_MOVIE_1996) };
  }

  return { meta: null };
});

builder.defineStreamHandler(async (args) => {
  if (args.type === 'movie' && args.id === DOCTOR_WHO_MOVIE_1996_STREMIO_ID) {
    return { streams: streamRegistry.buildMovieStreams(DOCTOR_WHO_MOVIE_1996) };
  }

  if (args.type !== 'series' || !args.id) {
    return { streams: [] };
  }

  const torchwoodEpisode = getTorchwoodEpisodeFromArgs(args.id);
  if (torchwoodEpisode) {
    const tag = TORCHWOOD_EPISODE_TAGS[getEpisodeKey(torchwoodEpisode)];
    return { streams: streamRegistry.buildTorchwoodStreams(torchwoodEpisode, tag) };
  }

  const episode = getEpisodeFromArgs(args.id);
  return { streams: streamRegistry.buildDoctorWhoStreams(episode) };
});

builder.defineSubtitlesHandler(async (args) => {
  if (args.type === 'movie' && args.id === DOCTOR_WHO_MOVIE_1996_STREMIO_ID) {
    return { subtitles: subtitleRegistry.getMovie1996Subtitles() };
  }

  if (args.type !== 'series' || !args.id) {
    return { subtitles: [] };
  }

  const episode = getEpisodeFromArgs(args.id);
  return { subtitles: subtitleRegistry.getDoctorWhoEpisodeSubtitles(episode) };
});

const addonRouter = getRouter(builder.getInterface());

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
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

  if (requestUrl.pathname === LIBRARY_PATH) {
    sendCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(renderLibraryPage());
    return;
  }

  if (requestUrl.pathname === INSTALL_PATH) {
    sendCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    void renderInstallPage()
      .then((html) => res.end(html))
      .catch((error) => {
        console.error('Failed to render install page:', error.message);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }
        res.end('Unable to render install page');
      });
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
      arabicSubtitles: subtitleRegistry.primaryArabicCount,
      streams: streamCounts.episodes
    });
    return;
  }

  if (requestUrl.pathname === '/status') {
    const streamCounts = getStreamCounts();
    const arabicAltCount = subtitleRegistry.getArabicAlternativeEpisodeCount();
    const arabicImprovedCount = subtitleRegistry.getArabicImprovedEpisodeCount();
    jsonResponse(res, 200, {
      name: manifest.name,
      version: manifest.version,
      episodeCount: allNewWhoEpisodes.length,
      arabicSubtitleCount: subtitleRegistry.primaryArabicCount,
      arabicPrimaryCount: subtitleRegistry.primaryArabicCount,
      arabicAlternativeCount: arabicAltCount,
      arabicImprovedCount,
      episodesMissingArabicAlternatives: subtitleRegistry.primaryArabicCount - arabicAltCount,
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

  if (subtitleRegistry.handleHttpRequest(req, res, requestUrl.pathname)) {
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
  console.log(`Arabic subtitles served from: ${PUBLIC_ADDON_BASE_URL}${subtitleRegistry.routes.arabic}/<filename>`);
  console.log(`Torchwood clean English subtitles served from: ${PUBLIC_ADDON_BASE_URL}${subtitleRegistry.routes.torchwoodCleanEnglish}/<filename>`);
});
