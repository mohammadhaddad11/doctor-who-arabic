const ARCHIVE_IDENTIFIER = 'torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p';
const ARCHIVE_DOWNLOAD_BASE_URL = `https://archive.org/download/${ARCHIVE_IDENTIFIER}`;
const POSTER_URL = `${ARCHIVE_DOWNLOAD_BASE_URL}/__ia_thumb.jpg`;

function buildArchiveMkvUrl(filename) {
  return `${ARCHIVE_DOWNLOAD_BASE_URL}/${encodeURIComponent(filename)}`;
}

function buildStream(episode, filename, bytes) {
  return {
    url: buildArchiveMkvUrl(filename),
    name: 'Whoniverse Arabic • 1080p • Original MKV',
    description: `Torchwood S01E${String(episode).padStart(2, '0')} • Dual audio: English DTS + Spanish AAC • Embedded English and Spanish subtitles`,
    bytes
  };
}

const episodes = [
  {
    title: 'Everything Changes',
    season: 1,
    episode: 1,
    released: new Date('2006-10-22').toISOString(),
    overview: 'Police constable Gwen Cooper encounters the secretive Torchwood team while investigating a murder, drawing her into a hidden world of aliens and technology beneath Cardiff.',
    thumbnail: POSTER_URL,
    streams: [buildStream(1, 'Torchwood 1x01 Todo cambia [Dual] [1080p].mkv', 4336150365)]
  },
  {
    title: 'Day One',
    season: 1,
    episode: 2,
    released: new Date('2006-10-22').toISOString(),
    overview: 'Intentionally skipped/unavailable: no playable stream is provided for this episode.',
    thumbnail: POSTER_URL,
    streams: []
  },
  {
    title: 'Ghost Machine',
    season: 1,
    episode: 3,
    released: new Date('2006-10-29').toISOString(),
    overview: 'An alien device gives Gwen visions of the past, leading Torchwood to an old crime whose consequences are still unfolding in the present.',
    thumbnail: POSTER_URL,
    streams: [buildStream(3, 'Torchwood 1x03 La máquina de los fantasmas [Dual] [1080p].mkv', 4321970425)]
  },
  {
    title: 'Cyberwoman',
    season: 1,
    episode: 4,
    released: new Date('2006-11-05').toISOString(),
    overview: 'Ianto hides a dangerous secret beneath the Hub, forcing the team into a deadly confrontation with the remnants of a Cyber-conversion experiment.',
    thumbnail: POSTER_URL,
    streams: [buildStream(4, 'Torchwood 1x04 La cibermujer [Dual] [1080p].mkv', 4324650868)]
  },
  {
    title: 'Small Worlds',
    season: 1,
    episode: 5,
    released: new Date('2006-11-12').toISOString(),
    overview: 'Strange, powerful beings from Jack’s past return to protect a lonely child, leaving Torchwood to face an impossible choice.',
    thumbnail: POSTER_URL,
    streams: [buildStream(5, 'Torchwood 1x05 Hadas [Dual] [1080p].mkv', 4326131633)]
  },
  {
    title: 'Countrycide',
    season: 1,
    episode: 6,
    released: new Date('2006-11-19').toISOString(),
    overview: 'A trail of disappearances takes Torchwood into the Welsh countryside, where the team discovers that the threat may be horrifyingly human.',
    thumbnail: POSTER_URL,
    streams: [buildStream(6, 'Torchwood 1x06 Caníbales [Dual] [1080p].mkv', 4307676818)]
  },
  {
    title: 'Greeks Bearing Gifts',
    season: 1,
    episode: 7,
    released: new Date('2006-11-26').toISOString(),
    overview: 'Toshiko receives an alien pendant that lets her hear people’s thoughts, but its mysterious owner has motives of her own.',
    thumbnail: POSTER_URL,
    streams: [buildStream(7, 'Torchwood 1x07 Regalo envenenado [Dual] [1080p].mkv', 4322543467)]
  },
  {
    title: 'They Keep Killing Suzie',
    season: 1,
    episode: 8,
    released: new Date('2006-12-03').toISOString(),
    overview: 'A series of murders forces Torchwood to resurrect Suzie Costello, but bringing her back creates a dangerous connection with Gwen.',
    thumbnail: POSTER_URL,
    streams: [buildStream(8, 'Torchwood 1x08 Volver a matar a Suzie [Dual] [1080p].mkv', 4332235872)]
  },
  {
    title: 'Random Shoes',
    season: 1,
    episode: 9,
    released: new Date('2006-12-10').toISOString(),
    overview: 'After an ordinary man dies in a hit-and-run, his spirit follows Gwen as she investigates his life and a mysterious alien artifact.',
    thumbnail: POSTER_URL,
    streams: [buildStream(9, 'Torchwood 1x09 Zapatos de desconocidos [Dual] [1080p].mkv', 4326206928)]
  },
  {
    title: 'Out of Time',
    season: 1,
    episode: 10,
    released: new Date('2006-12-17').toISOString(),
    overview: 'Reserved for a clean-cut version that will be integrated later; no playable stream is currently provided.',
    thumbnail: POSTER_URL,
    streams: []
  },
  {
    title: 'Combat',
    season: 1,
    episode: 11,
    released: new Date('2006-12-24').toISOString(),
    overview: 'Owen infiltrates a group linked to Weevil abductions and discovers an underground operation exploiting the creatures for sport.',
    thumbnail: POSTER_URL,
    streams: [buildStream(11, 'Torchwood 1x11 El combate [Dual] [1080p].mkv', 4325840220)]
  },
  {
    title: 'Captain Jack Harkness',
    season: 1,
    episode: 12,
    released: new Date('2007-01-01').toISOString(),
    overview: 'Jack and Toshiko are transported to 1941, where Jack meets the real Captain Jack Harkness while the team races to bring them home.',
    thumbnail: POSTER_URL,
    streams: [buildStream(12, 'Torchwood 1x12 Capitán Jack Harkness [Dual] [1080p].mkv', 4329029159)]
  },
  {
    title: 'End of Days',
    season: 1,
    episode: 13,
    released: new Date('2007-01-01').toISOString(),
    overview: 'Reserved for a clean-cut version that will be integrated later; no playable stream is currently provided.',
    thumbnail: POSTER_URL,
    streams: []
  }
];

module.exports = {
  ARCHIVE_IDENTIFIER,
  POSTER_URL,
  episodes
};
