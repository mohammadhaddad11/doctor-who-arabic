const fs = require('fs');
const http = require('http');
const path = require('path');
const { addonBuilder, getRouter } = require('stremio-addon-sdk');
const allNewWhoEpisodesPreSorted = require('./episodeData');
const arabicSubtitleFiles = require('./arabicSubtitles.json');
const streamMetadata = require('./streamMetadata.json');
const subtitleStatus = require('./subtitleStatus.json');

const NEW_WHO_SERIES_STREMIO_ID = 'whoniverse_new_who';
const ARABIC_SUBTITLE_FILES = new Set(arabicSubtitleFiles);
const STREAM_METADATA_EPISODES = streamMetadata.episodes || {};
const STREAM_SUMMARY = streamMetadata.summary || {};
const SUBTITLE_STATUS_ENTRIES = subtitleStatus.entries || {};
const SUBTITLE_STATUS_SUMMARY = subtitleStatus.summary || {};

const ADDON_LOGO_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const NEW_WHO_SERIES_POSTER_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const NEW_WHO_SERIES_BACKGROUND_URL = 'https://www.stremio.com/website/stremio-logo-small.png';
const ARABIC_SUBTITLE_DIR = path.join(__dirname, 'ar');
const ARABIC_SUBTITLE_ROUTE = '/subtitles/ar';
const port = Number(process.env.PORT) || 7000;
const host = process.env.HOST || '0.0.0.0';
const REPORT_PATH = '/report';
const REVIEW_SUBTITLE_DIR = path.join(__dirname, 'review', 'arabic-subtitles');
const GITHUB_ISSUE_TEMPLATE_URL = 'https://github.com/mohammadhaddad11/doctor-who-arabic/issues/new?template=subtitle-issue.md';

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

const manifest = {
  id: 'community.mhaddad.whoniverse.arabic',
  version: '1.4.0',
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

function getEpisodeStreamMetadata(episode) {
  const key = getEpisodeKey(episode);
  return key ? STREAM_METADATA_EPISODES[key] || null : null;
}

function getMetadataBackedStreams(episode) {
  const metadata = getEpisodeStreamMetadata(episode);

  if (!metadata || !metadata.primary) {
    return [];
  }

  const speedAlternative = (metadata.alternatives || [])
    .filter((entry) => entry.label === '480p')
    .sort((a, b) => {
      if ((b.healthScore || 0) !== (a.healthScore || 0)) {
        return (b.healthScore || 0) - (a.healthScore || 0);
      }

      return (a.responseTimeMs || 0) - (b.responseTimeMs || 0);
    })[0];

  return speedAlternative ? [metadata.primary, speedAlternative] : [metadata.primary];
}

function buildStreamLabel(streamEntry) {
  const mode = streamEntry.label === '480p' ? 'Speed' : 'Quality';
  const prefix = `Whoniverse ${streamEntry.label} • ${mode}`;

  if (!streamEntry.sizeLabel) {
    return prefix;
  }

  return `${prefix} • ${streamEntry.sizeLabel}`;
}

function buildStreamDescription(streamEntry, episode) {
  const parts = [];

  if (isSpecialEpisode(episode)) {
    parts.push('Special episode');
  }

  parts.push(streamEntry.label === '480p' ? 'Speed' : 'Quality');
  parts.push(`Source health ${streamEntry.healthScore || 0}/100`);

  return parts.join(' • ');
}

function buildStreamsForEpisode(episode) {
  if (!episode || !episode.streamUrl) {
    return [];
  }

  const subtitles = getSubtitleTracks(episode);
  const metadataBackedStreams = getMetadataBackedStreams(episode);

  if (metadataBackedStreams.length > 0) {
    return metadataBackedStreams.map((streamEntry) => ({
      url: streamEntry.url,
      name: buildStreamLabel(streamEntry),
      description: buildStreamDescription(streamEntry, episode),
      subtitles
    }));
  }

  return [
    {
      url: episode.streamUrl,
      name: 'Whoniverse 1080p • Quality',
      description: isSpecialEpisode(episode) ? 'Special episode • Quality' : 'Quality',
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

function getStreamCounts() {
  return {
    episodes: Object.keys(STREAM_METADATA_EPISODES).length,
    stream1080p: STREAM_SUMMARY.episodesWith1080p || 0,
    stream480p: STREAM_SUMMARY.episodesWith480pAdded || 0,
    stream720p: STREAM_SUMMARY.episodesWith720pAdded || 0,
    fastStartBackups: STREAM_SUMMARY.episodesWithFastStartBackup || 0
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

function renderHtmlPage(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:32px;line-height:1.5}
    main{max-width:900px;margin:0 auto}
    a{color:#93c5fd}
    .card{background:#111827;border:1px solid #334155;border-radius:16px;padding:24px;margin-bottom:20px}
    .actions{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}
    .button{display:inline-block;padding:12px 16px;border-radius:12px;background:#2563eb;color:white;text-decoration:none;font-weight:600}
    code,textarea{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    textarea{width:100%;min-height:320px;background:#020617;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:12px}
    .muted{color:#94a3b8}
    ul{padding-left:20px}
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
  return renderHtmlPage(
    manifest.name,
    `<div class="card">
      <h1>Whoniverse Arabic 1080p</h1>
      <p><strong>Status:</strong> online</p>
      <div class="actions">
        <a class="button" href="${htmlEscape(manifestUrl)}">Install in Stremio</a>
        <a class="button" href="${htmlEscape(REPORT_PATH)}">Report Subtitle Issue</a>
      </div>
      <p><strong>Manifest URL:</strong> <a href="${htmlEscape(manifestUrl)}">${htmlEscape(manifestUrl)}</a></p>
      <p>English and Arabic subtitles are separate selectable tracks.</p>
      <p>Use 1080p for quality or 480p for speed.</p>
    </div>
    <div class="card">
      <h2>Current Production Counts</h2>
      <ul>
        <li>Episode entries: ${allNewWhoEpisodes.length}</li>
        <li>Arabic subtitles: ${ARABIC_SUBTITLE_FILES.size}</li>
        <li>1080p stream entries: ${streamCounts.stream1080p}</li>
        <li>480p speed entries: ${streamCounts.stream480p}</li>
        <li>Manual review subtitles still visible: ${SUBTITLE_STATUS_SUMMARY.manual_review || 0}</li>
      </ul>
      <p class="muted">If Arabic looks delayed or wrong, keep it selected and report the exact episode and timestamp from the report page.</p>
    </div>`
  );
}

function renderReportPage() {
  const issueTemplate = `Season:\nEpisode:\nEpisode title:\nSubtitle language: Arabic / English\nProblem type:\n- Arabic text garbled\n- Arabic delay\n- Wrong episode subtitle\n- Missing Arabic\n- Other\nApproximate timestamp:\nDevice:\nStream quality used: 1080p or 480p\nNotes:`;
  return renderHtmlPage(
    'Report Subtitle Issue',
    `<div class="card">
      <h1>Report a Subtitle Issue</h1>
      <p>Arabic subtitles stay visible even when they are under review. If you see a problem, open a GitHub issue and include the fields below.</p>
      <div class="actions">
        <a class="button" href="${htmlEscape(GITHUB_ISSUE_TEMPLATE_URL)}">Open GitHub Issue</a>
      </div>
      <ul>
        <li>Season</li>
        <li>Episode</li>
        <li>Episode title</li>
        <li>Subtitle language</li>
        <li>Problem type</li>
        <li>Approximate timestamp</li>
        <li>Device</li>
        <li>Stream quality used: 1080p or 480p</li>
      </ul>
    </div>
    <div class="card">
      <h2>Copy-Paste Template</h2>
      <textarea readonly>${htmlEscape(issueTemplate)}</textarea>
    </div>`
  );
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
    jsonResponse(res, 200, {
      name: manifest.name,
      version: manifest.version,
      episodeCount: allNewWhoEpisodes.length,
      arabicSubtitleCount: ARABIC_SUBTITLE_FILES.size,
      stream1080pCount: streamCounts.stream1080p,
      stream480pCount: streamCounts.stream480p,
      manualReviewSubtitleCount: SUBTITLE_STATUS_SUMMARY.manual_review || 0,
      reviewFolderCount: getReviewSubtitleCount(),
      subtitleStatusSummary: SUBTITLE_STATUS_SUMMARY,
      streamHealthSummary: STREAM_SUMMARY.primary || {},
      deploymentBaseUrl: PUBLIC_ADDON_BASE_URL,
      manifest: getManifestUrl()
    });
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
