const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const allNewWhoEpisodesPreSorted = require('./episodeData');
const arabicSubtitleFiles = require('./arabicSubtitles.json');

const NEW_WHO_SERIES_STREMIO_ID = `whoniverse_new_who`;
const ARABIC_SUBTITLE_FILES = new Set(arabicSubtitleFiles);

const ADDON_LOGO_URL = "https://www.stremio.com/website/stremio-logo-small.png";
const NEW_WHO_SERIES_POSTER_URL = "https://www.stremio.com/website/stremio-logo-small.png";
const NEW_WHO_SERIES_BACKGROUND_URL = "https://www.stremio.com/website/stremio-logo-small.png";
const ARABIC_SUBTITLE_BASE_URL = 'https://cdn.jsdelivr.net/gh/mohammadhaddad11/doctor-who-arabic@main/ar/';
const port = Number(process.env.PORT) || 7000;

const manifest = {
  "id": "community.mhaddad.whoniverse.arabic",
  "version": "1.3.0",
  "name": "Whoniverse Arabic 1080p",
  "description": "Doctor Who for Stremio with English and Arabic subtitle tracks as separate selectable options.",
  "logo": ADDON_LOGO_URL,
  "types": ["series"],
  "resources": ["catalog", "meta", "stream", "subtitles"],
  "catalogs": [
    {
      "type": "series",
      "id": "whoniverse_catalog",
      "name": "Whoniverse"
    }
  ],
  "behaviorHints": {
    "configurable": false,
    "adult": false
  }
};

const builder = new addonBuilder(manifest);

const allNewWhoEpisodes = [...allNewWhoEpisodesPreSorted].sort((a, b) => {
    const dateA = new Date(a.released);
    const dateB = new Date(b.released);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
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

    const season = parseInt(seasonStr, 10);
    const episodeNum = parseInt(episodeStr, 10);

    return allNewWhoEpisodes.find(ep => ep.season === season && ep.episode === episodeNum) || null;
}

function getArabicSubtitleFilename(episode) {
    if (!episode || !episode.subtitleUrl) {
        return null;
    }

    const englishName = episode.subtitleUrl.split('/').pop();
    if (!englishName || !/\.srt$/i.test(englishName)) {
        return null;
    }

    return englishName.replace(/\.srt$/i, '.ar.srt');
}

function getArabicSubtitleUrl(episode) {
    const arabicName = getArabicSubtitleFilename(episode);
    if (!arabicName || !ARABIC_SUBTITLE_FILES.has(arabicName)) {
        return null;
    }

    return `${ARABIC_SUBTITLE_BASE_URL}${encodeURIComponent(arabicName)}`;
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
            id: 'remote_ar_sub',
            url: arabicUrl,
            lang: 'ara'
        });
    }

    return subtitles;
}

builder.defineCatalogHandler(async (args) => {
    if (args.type === 'series' && args.id === manifest.catalogs[0].id) {
        const seriesForCatalog = [
            {
                id: NEW_WHO_SERIES_STREMIO_ID,
                type: 'series',
                name: "New Who 1080p",
                poster: NEW_WHO_SERIES_POSTER_URL,
                description: "Doctor Who from 2005 onward with separate English and Arabic subtitle tracks when available.",
                logo: ADDON_LOGO_URL,
                genres: ["Sci-Fi", "Adventure", "Drama"],
                releaseInfo: "2005-Present",
            }
        ];
        return Promise.resolve({ metas: seriesForCatalog });
    } else {
        return Promise.resolve({ metas: [] });
    }
});

builder.defineMetaHandler(async (args) => {
    if (args.type === 'series' && args.id === NEW_WHO_SERIES_STREMIO_ID) {
        const seriesMetaObject = {
            id: NEW_WHO_SERIES_STREMIO_ID,
            type: 'series',
            name: "New Who 1080p",
            poster: NEW_WHO_SERIES_POSTER_URL,
            background: NEW_WHO_SERIES_BACKGROUND_URL,
            logo: ADDON_LOGO_URL,
            description: "Doctor Who from 2005 onward in broadcast order, with separate English and Arabic subtitle options and 1080p stream presentation.",
            releaseInfo: "2005-Present",
            genres: ["Sci-Fi", "Adventure", "Drama"],
            videos: allNewWhoEpisodes.map(ep => {
                const videoId = `${NEW_WHO_SERIES_STREMIO_ID}:${ep.season}:${ep.episode}`;
                return {
                    id: videoId,
                    title: ep.title,
                    season: ep.season,
                    episode: ep.episode,
                    released: ep.released,
                    overview: ep.overview,
                    thumbnail: ep.thumbnail || ADDON_LOGO_URL,
                    available: !!ep.streamUrl
                };
            })
        };
        return Promise.resolve({ meta: seriesMetaObject });
    }
    return Promise.resolve({ meta: null });
});

builder.defineStreamHandler(async (args) => {
    if (args.type === 'series' && args.id) {
        const episode = getEpisodeFromArgs(args.id);

        if (!episode) {
            return Promise.resolve({ streams: [] });
        }

        if (episode && episode.streamUrl) {
            const stream = {
                url: episode.streamUrl,
                name: "Whoniverse 1080p",
                description: "1080p",
                subtitles: getSubtitleTracks(episode)
            };
            
            return Promise.resolve({ streams: [stream] });
        }
    }
    return Promise.resolve({ streams: [] });
});

builder.defineSubtitlesHandler(async (args) => {
  if (args.type === 'series' && args.id) {
    const episode = getEpisodeFromArgs(args.id);

    if (episode) {
      return {
        subtitles: getSubtitleTracks(episode)
      };
    }
  }
  return { subtitles: [] };
});

serveHTTP(builder.getInterface(), { port: port });
console.log(`Whoniverse Addon active on http://localhost:${port}`);
console.log(`Install by copying this URL to Stremio's Addon search bar: http://127.0.0.1:${port}/manifest.json`);
