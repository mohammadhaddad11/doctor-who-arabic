const fs = require('fs');
const http = require('http');
const path = require('path');
const { addonBuilder, getRouter } = require('stremio-addon-sdk');
const allNewWhoEpisodesPreSorted = require('./episodeData');
const arabicSubtitleFiles = require('./arabicSubtitles.json');
const streamMetadata = require('./streamMetadata.json');

const NEW_WHO_SERIES_STREMIO_ID = 'whoniverse_new_who';
const ARABIC_SUBTITLE_FILES = new Set(arabicSubtitleFiles);

const ADDON_LOGO_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const NEW_WHO_SERIES_POSTER_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const NEW_WHO_SERIES_BACKGROUND_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const ARABIC_SUBTITLE_DIR = path.join(__dirname, 'ar');
const ARABIC_SUBTITLE_ROUTE = '/subtitles/ar';
const port = Number(process.env.PORT) || 7000;

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function resolvePublicBaseUrl() {
  const directBaseUrl =
    process.env.ADDON_BASE_URL ||
    process.env.PUBLIC_URL ||
    process.env.RENDER_EXTERNAL_URL;

  if (directBaseUrl) {
    return trimTrailingSlash(directBaseUrl);
  }

  const hostOnlyBaseUrl =
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.RAILWAY_STATIC_URL ||
    process.env.VERCEL_URL;

  if (hostOnlyBaseUrl) {
    return `https://${trimTrailingSlash(hostOnlyBaseUrl.replace(/^https?:\/\//, ''))}`;
  }

  return `http://127.0.0.1:${port}`;
}

const PUBLIC_ADDON_BASE_URL = resolvePublicBaseUrl();

const manifest = {
  id: 'community.mhaddad.whoniverse.arabic',
  version: '1.3.0',
  name: 'Whoniverse Arabic',
  description: 'Doctor Who for Stremio with separate English and Arabic subtitle tracks, size-aware streams, and direct fallback streams for selected slow specials.',
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

function buildArabicSubtitleUrl(arabicName) {
  return `${PUBLIC_ADDON_BASE_URL}${ARABIC_SUBTITLE_ROUTE}/${encodeURIComponent(arabicName)}`;
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

function getSubtitleTracks(episode) {
  if (!episode) {
    return [];
  }

  const subtitles = [];

  if (episode.subtitleUrl) {
    subtitles.push({
      id: 'archive_en_sub',
      url: episode.subtitleUrl,
      lang: 'eng'
    });
  }

  const arabicUrl = getArabicSubtitleUrl(episode);
  if (arabicUrl) {
    subtitles.push({
      id: 'local_ar_sub',
      url: arabicUrl,
      lang: 'ara'
    });
  }

  return subtitles;
}

function getStreamFilename(episode) {
  if (!episode || !episode.streamUrl) {
    return null;
  }

  return episode.streamUrl.split('/').pop() || null;
}

function getEpisodeStreamMetadata(episode) {
  const filename = getStreamFilename(episode);
  return filename ? streamMetadata[filename] || null : null;
}

function buildPrimaryStreamLabel(metadata) {
  if (!metadata || !metadata.sizeLabel) {
    return 'Whoniverse 1080p';
  }

  return `Whoniverse 1080p • ${metadata.sizeLabel}`;
}

function buildPrimaryStreamDescription(metadata) {
  if (!metadata || !metadata.sizeLabel) {
    return '1080p direct stream';
  }

  return `1080p direct stream • ${metadata.sizeLabel}`;
}

function buildStreamsForEpisode(episode) {
  if (!episode || !episode.streamUrl) {
    return [];
  }

  const metadata = getEpisodeStreamMetadata(episode);
  const subtitles = getSubtitleTracks(episode);
  const streams = [
    {
      url: episode.streamUrl,
      name: buildPrimaryStreamLabel(metadata),
      description: buildPrimaryStreamDescription(metadata),
      subtitles
    }
  ];

  if (metadata && metadata.backup) {
    streams.push({
      url: metadata.backup.url,
      name: `Whoniverse Fast Start • ${metadata.backup.sizeLabel}`,
      description: `Direct backup ${metadata.backup.qualityLabel} • ${metadata.backup.sizeLabel}`,
      subtitles
    });
  }

  return streams;
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
          description: 'Doctor Who from 2005 onward with separate English and Arabic subtitle tracks, size-aware stream labels, and conservative direct fallback streams for selected specials.',
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
        description: 'Doctor Who from 2005 onward in broadcast order, with separate English and Arabic subtitle options, file size labels, and carefully targeted direct fallback streams.',
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

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `127.0.0.1:${port}`}`);

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

server.listen(port, () => {
  console.log(`Whoniverse Addon active on http://localhost:${port}`);
  console.log(`Install by copying this URL to Stremio's Addon search bar: http://127.0.0.1:${port}/manifest.json`);
  console.log(`Arabic subtitles served from: ${PUBLIC_ADDON_BASE_URL}${ARABIC_SUBTITLE_ROUTE}/<filename>`);
});
