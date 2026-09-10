const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SUBTITLE_ROUTES = Object.freeze({
  arabic: '/subtitles/ar',
  arabicAlternative: '/subtitles/ar-alt',
  arabicImproved: '/subtitles/ar-improved',
  movieArabic: '/subtitles/movie-ar',
  torchwoodCleanEnglish: '/subtitles/torchwood-en-clean'
});

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

function getEpisodeKey(episode) {
  if (!episode) {
    return null;
  }
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function getArabicImprovedEntryFilename(value) {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value.filename === 'string') {
    return value.filename.trim();
  }
  return null;
}

function createSubtitleRegistry({
  rootDir,
  publicBaseUrl,
  primaryArabicFiles,
  arabicAlternativeIndex,
  arabicImprovedIndex,
  movie
}) {
  const primaryFiles = new Set(primaryArabicFiles || []);
  const alternativeIndex = arabicAlternativeIndex || {};
  const improvedIndex = arabicImprovedIndex || {};
  const improvedAllowedFiles = new Set(
    Object.values(improvedIndex)
      .map(getArabicImprovedEntryFilename)
      .filter((filename) => Boolean(filename) && filename === path.basename(filename))
  );
  const torchwoodAllowedFiles = new Set(Object.values(TORCHWOOD_CLEAN_ENGLISH_SUBTITLES));
  const versionCache = new Map();
  const directories = {
    arabic: path.join(rootDir, 'ar'),
    arabicAlternative: path.join(rootDir, 'ar-alt'),
    arabicImproved: path.join(rootDir, 'ar-improved'),
    movieArabic: path.join(rootDir, 'movie-subtitles'),
    torchwoodCleanEnglish: path.join(rootDir, 'torchwood-subtitles', 'en-clean')
  };

  function getContentVersion(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }
    try {
      const stats = fs.statSync(filePath);
      const cached = versionCache.get(filePath);
      if (cached && cached.mtimeMs === stats.mtimeMs && cached.size === stats.size) {
        return cached.version;
      }
      const version = crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex').slice(0, 12);
      versionCache.set(filePath, { mtimeMs: stats.mtimeMs, size: stats.size, version });
      return version;
    } catch (error) {
      console.warn(`Unable to hash subtitle for cache busting (${filePath}):`, error.message);
      return null;
    }
  }

  function buildLocalUrl(kind, filename) {
    const filePath = path.join(directories[kind], filename);
    const version = getContentVersion(filePath);
    const baseUrl = `${publicBaseUrl}${SUBTITLE_ROUTES[kind]}/${encodeURIComponent(filename)}`;
    return version ? `${baseUrl}?v=${encodeURIComponent(version)}` : baseUrl;
  }

  function getEnglishFilename(episode) {
    return episode?.subtitleUrl?.split('/').pop() || null;
  }

  function getArabicFilename(episode) {
    const englishFilename = getEnglishFilename(episode);
    return englishFilename && /\.srt$/i.test(englishFilename)
      ? englishFilename.replace(/\.srt$/i, '.ar.srt')
      : null;
  }

  function getArabicImprovedFilename(episode) {
    const mappedName = getArabicImprovedEntryFilename(improvedIndex[getEpisodeKey(episode)]);
    if (!mappedName || mappedName !== path.basename(mappedName) || !/\.srt$/i.test(mappedName)) {
      return null;
    }
    return improvedAllowedFiles.has(mappedName) ? mappedName : null;
  }

  function getDoctorWhoEpisodeSubtitles(episode) {
    if (!episode) {
      return [];
    }
    const subtitles = [];
    if (episode.subtitleUrl) {
      subtitles.push({ id: 'archive_en_sub', url: episode.subtitleUrl, lang: 'English' });
    }

    const improvedFilename = getArabicImprovedFilename(episode);
    const improvedPath = improvedFilename ? path.join(directories.arabicImproved, improvedFilename) : null;
    const improvedUrl = improvedPath && fs.existsSync(improvedPath)
      ? buildLocalUrl('arabicImproved', improvedFilename)
      : null;
    if (improvedUrl) {
      subtitles.push({
        id: 'local_ar_improved_sub',
        url: improvedUrl,
        lang: 'Arabic',
        title: 'Arabic Improved',
        name: 'Arabic Improved'
      });
    }

    const arabicFilename = getArabicFilename(episode);
    const arabicPath = arabicFilename ? path.join(directories.arabic, arabicFilename) : null;
    if (arabicFilename && primaryFiles.has(arabicFilename) && fs.existsSync(arabicPath)) {
      subtitles.push({
        id: 'local_ar_sub',
        url: buildLocalUrl('arabic', arabicFilename),
        lang: 'Arabic',
        ...(improvedUrl ? { title: 'Arabic Backup', name: 'Arabic Backup' } : {})
      });
    }

    const alternatives = arabicFilename ? alternativeIndex[arabicFilename] || [] : [];
    subtitles.push(...alternatives
      .filter((entry) => entry?.filename)
      .filter((entry) => fs.existsSync(path.join(directories.arabicAlternative, entry.filename)))
      .map((entry, index) => ({
        id: `arabic_alt_${index + 1}`,
        url: buildLocalUrl('arabicAlternative', entry.filename),
        lang: entry.label || `Arabic Alt${index > 0 ? ` ${index + 1}` : ''}`
      })));
    return subtitles;
  }

  function getMovie1996Subtitles() {
    const filename = movie?.arabicImprovedSubtitle;
    if (!filename || !fs.existsSync(path.join(directories.movieArabic, filename))) {
      return [];
    }
    return [{
      id: 'movie_ar_improved_sub',
      url: buildLocalUrl('movieArabic', filename),
      lang: 'Arabic',
      title: 'Arabic Improved (عربي)',
      name: 'Arabic Improved (عربي)'
    }];
  }

  function getTorchwoodCleanSubtitles(episode) {
    const filename = TORCHWOOD_CLEAN_ENGLISH_SUBTITLES[getEpisodeKey(episode)];
    if (!filename || !fs.existsSync(path.join(directories.torchwoodCleanEnglish, filename))) {
      return [];
    }
    return [{
      id: 'torchwood_clean_en_sub',
      url: buildLocalUrl('torchwoodCleanEnglish', filename),
      lang: 'English',
      title: 'English (Clean Cut)',
      name: 'English (Clean Cut)'
    }];
  }

  function sendCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  }

  function sendNotFound(res, message) {
    sendCorsHeaders(res);
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(message);
  }

  function serveFile(req, res, kind, filename, isAllowed, notFoundMessage) {
    const safeName = path.basename(filename);
    if (!safeName || safeName !== filename || !isAllowed(safeName)) {
      sendNotFound(res, notFoundMessage);
      return;
    }
    const filePath = path.join(directories[kind], safeName);
    if (!fs.existsSync(filePath)) {
      sendNotFound(res, `${notFoundMessage} file missing`);
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

  const routeDefinitions = [
    { kind: 'arabicAlternative', isAllowed: (filename) => fs.existsSync(path.join(directories.arabicAlternative, filename)), message: 'Subtitle alternative not found' },
    { kind: 'arabicImproved', isAllowed: (filename) => improvedAllowedFiles.has(filename), message: 'Arabic improved subtitle not found' },
    { kind: 'movieArabic', isAllowed: (filename) => filename === movie?.arabicImprovedSubtitle, message: 'Movie subtitle not found' },
    { kind: 'torchwoodCleanEnglish', isAllowed: (filename) => torchwoodAllowedFiles.has(filename), message: 'Torchwood subtitle not found' },
    { kind: 'arabic', isAllowed: (filename) => primaryFiles.has(filename), message: 'Subtitle not found' }
  ];

  function handleHttpRequest(req, res, pathname) {
    const route = routeDefinitions.find((entry) => pathname.startsWith(`${SUBTITLE_ROUTES[entry.kind]}/`));
    if (!route) {
      return false;
    }
    if (req.method === 'OPTIONS') {
      sendCorsHeaders(res);
      res.statusCode = 204;
      res.end();
      return true;
    }
    const encodedFilename = pathname.slice(`${SUBTITLE_ROUTES[route.kind]}/`.length);
    let filename;
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      sendNotFound(res, route.message);
      return true;
    }
    serveFile(req, res, route.kind, filename, route.isAllowed, route.message);
    return true;
  }

  return Object.freeze({
    routes: SUBTITLE_ROUTES,
    primaryArabicCount: primaryFiles.size,
    getEpisodeSubtitles: getDoctorWhoEpisodeSubtitles,
    getDoctorWhoEpisodeSubtitles,
    getMovieSubtitles: getMovie1996Subtitles,
    getMovie1996Subtitles,
    getTorchwoodCleanSubtitles,
    getArabicAlternativeEpisodeCount: () => Object.keys(alternativeIndex).length,
    getArabicImprovedEpisodeCount: () => Object.entries(improvedIndex).reduce((count, [, value]) => {
      const filename = getArabicImprovedEntryFilename(value);
      return filename
        && filename === path.basename(filename)
        && improvedAllowedFiles.has(filename)
        && fs.existsSync(path.join(directories.arabicImproved, filename))
        ? count + 1
        : count;
    }, 0),
    handleHttpRequest
  });
}

module.exports = {
  SUBTITLE_ROUTES,
  TORCHWOOD_CLEAN_ENGLISH_SUBTITLES,
  createSubtitleRegistry,
  getArabicImprovedEntryFilename
};
