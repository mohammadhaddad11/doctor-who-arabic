const newWhoEpisodes = require('./episodeData');
const { episodes: torchwoodEpisodes } = require('./torchwoodData');
const { DEFAULT_EPISODE_GENRES } = require('./episodeTagMetadata');

const CONTENT_IDS = Object.freeze({
  newWho: 'whoniverse_new_who',
  torchwood: 'whoniverse_torchwood',
  doctorWhoMovie1996: 'doctor-who-movie-1996'
});

const CATALOGS = Object.freeze({
  series: Object.freeze({
    type: 'series',
    id: 'whoniverse_catalog',
    name: 'Whoniverse'
  }),
  movies: Object.freeze({
    type: 'movie',
    id: 'whoniverse_movies',
    name: 'Whoniverse Movies'
  })
});

const DOCTOR_WHO_MOVIE_1996_ARABIC_SUBTITLE = 'doctor-who-movie-1996.primary.improved.ar.srt';
const DOCTOR_WHO_MOVIE_1996_STREAMS = Object.freeze([
  Object.freeze({
    url: 'https://archive.org/download/doctor-who-the-movie-1996-1080p-blu-ray-hdr-10-flac-2-0-x-265-gene-mige/Doctor%20Who%20The%20Movie%201996%201080p%20BluRay%20HDR10%20FLAC%202%200%20x265-GeneMige.mkv',
    name: 'Whoniverse Arabic • 1080p • Primary',
    description: 'Doctor Who (1996) • MKV • HEVC Main 10 HDR • 5.10 GB',
    bytes: 5104562536
  })
]);

function createContentLibrary({ addonLogoUrl, assetBaseUrl }) {
  const assetUrl = (filename) => `${assetBaseUrl}/${filename}`;
  const torchwoodDescription = 'Torchwood in broadcast order. Original episodes use 1080p Archive.org MKV sources, while selected episodes use clean-cut versions. S01E02 is listed for continuity only and intentionally has no playable stream. Some sources include embedded English subtitles. Arabic subtitles for Torchwood are planned for a later episode-by-episode pass.';
  const series = Object.freeze([
    Object.freeze({
      id: CONTENT_IDS.newWho,
      type: 'series',
      name: 'New Who 1080p',
      poster: assetUrl('doctor-who-2005.jpg'),
      background: assetUrl('doctor-who-2005.jpg'),
      logo: addonLogoUrl,
      catalogDescription: 'Doctor Who from 2005 onward with separate English and Arabic subtitle tracks plus simple 1080p quality and 480p speed stream choices.',
      description: 'Doctor Who from 2005 onward in broadcast order, with separate English and Arabic subtitle options plus audited 1080p quality and 480p speed streams.',
      releaseInfo: '2005-Present',
      genres: DEFAULT_EPISODE_GENRES,
      episodes: newWhoEpisodes,
      sourceModule: 'episodeData.js'
    }),
    Object.freeze({
      id: CONTENT_IDS.torchwood,
      type: 'series',
      name: 'Torchwood 1080p',
      poster: assetUrl('d9f12b548fb3d1f0faa4689d82fe3390.jpg'),
      background: assetUrl('384e089469940aeb0ce2ff2e24863cec.jpg'),
      logo: addonLogoUrl,
      catalogDescription: torchwoodDescription,
      description: torchwoodDescription,
      releaseInfo: '2006-2011',
      genres: Object.freeze(['Science Fiction', 'Drama']),
      episodes: torchwoodEpisodes,
      sourceModule: 'torchwoodData.js',
      notes: Object.freeze({
        unavailableEpisodeIds: Object.freeze(['S01E02']),
        cleanCutEpisodeIds: Object.freeze(['S01E10', 'S01E13', 'S02E03', 'S02E05', 'S02E09', 'S02E11', 'S04E03', 'S04E07'])
      })
    })
  ]);
  const movies = Object.freeze([
    Object.freeze({
      id: CONTENT_IDS.doctorWhoMovie1996,
      type: 'movie',
      name: 'Doctor Who: The Movie 1996',
      poster: assetUrl('movie.jpg'),
      background: assetUrl('movie.jpg'),
      catalogDescription: 'The Doctor Who television movie starring Paul McGann as the Eighth Doctor.',
      description: 'The Doctor Who television movie starring Paul McGann as the Eighth Doctor.',
      releaseInfo: '1996',
      genres: DEFAULT_EPISODE_GENRES,
      streams: DOCTOR_WHO_MOVIE_1996_STREAMS,
      arabicImprovedSubtitle: DOCTOR_WHO_MOVIE_1996_ARABIC_SUBTITLE
    })
  ]);

  return Object.freeze({
    series,
    movies,
    getSeriesById: (id) => series.find((entry) => entry.id === id) || null,
    getMovieById: (id) => movies.find((entry) => entry.id === id) || null
  });
}

module.exports = {
  CATALOGS,
  CONTENT_IDS,
  createContentLibrary
};
