const episodeImages = require('./torchwoodEpisodeImages');

const ARCHIVE_IDENTIFIERS = Object.freeze({
  clean: 'Torchwood.clean',
  season1: 'torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p',
  season2: 'torchwood-2x-04-carne-carne-dual-1080p',
  season3: 'torchwood-temporada-3-dual-1080p',
  season4: 'torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p'
});
const POSTER_URL = `https://archive.org/download/${ARCHIVE_IDENTIFIERS.season1}/__ia_thumb.jpg`;

function buildArchiveUrl(identifier, filename) {
  return `https://archive.org/download/${identifier}/${encodeURIComponent(filename)}`;
}

function formatFileSize(bytes) {
  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

function buildStream(episode, filename, bytes) {
  return {
    url: buildArchiveUrl(ARCHIVE_IDENTIFIERS.season1, filename),
    name: 'Torchwood 1080p • Original MKV',
    description: `Torchwood S01E${String(episode).padStart(2, '0')} • Original Archive.org MKV • English + Spanish audio • Embedded English subtitles • ${formatFileSize(bytes)}`,
    bytes
  };
}

function buildOriginalStream(season, episode, filename, bytes) {
  return {
    url: buildArchiveUrl(ARCHIVE_IDENTIFIERS[`season${season}`], filename),
    name: 'Torchwood 1080p • Original MKV',
    description: `Torchwood S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')} • Original Archive.org MKV • English + Spanish audio • Embedded English subtitles • ${formatFileSize(bytes)}`,
    bytes
  };
}

function buildCleanStream(season, episode, filename, bytes) {
  return {
    url: buildArchiveUrl(ARCHIVE_IDENTIFIERS.clean, filename),
    name: 'Torchwood Clean Cut • 1080p',
    description: `Torchwood S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')} • Clean-cut version • AAC audio • No embedded subtitles • ${formatFileSize(bytes)}`,
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
    overview: 'Three passengers from 1953 arrive in modern Cardiff through the Rift and must confront the painful reality of lives displaced from their own time.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(1, 10, 'S01E10.clean.v2.fade.mp4', 2540380537)]
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
    overview: 'As the Rift splinters time across the world, the fractured Torchwood team faces visions of the past and a threat that could end everything.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(1, 13, 'S01E13.clean.mp4', 3383038878)]
  },
  {
    title: 'Kiss Kiss, Bang Bang',
    season: 2,
    episode: 1,
    released: new Date('2008-01-16').toISOString(),
    overview: 'Jack returns to Torchwood as a dangerous former partner arrives in Cardiff searching for a powerful object.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 1, 'Torchwood 2x01 Kiss Kiss, Bang Bang [Dual] [1080p].mkv', 4328964013)]
  },
  {
    title: 'Sleeper',
    season: 2,
    episode: 2,
    released: new Date('2008-01-23').toISOString(),
    overview: 'A brutal burglary exposes an alien sleeper agent and a hidden threat capable of launching a worldwide assault.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 2, 'Torchwood 2x02 La célula dormida [Dual] [1080p].mkv', 4328505780)]
  },
  {
    title: 'To the Last Man',
    season: 2,
    episode: 3,
    released: new Date('2008-01-30').toISOString(),
    overview: 'Toshiko grows close to a soldier displaced from 1918 whose return to his own time is essential to preventing a catastrophe.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(2, 3, 'S02E03.clean.mp4', 3150918168)]
  },
  {
    title: 'Meat',
    season: 2,
    episode: 4,
    released: new Date('2008-02-06').toISOString(),
    overview: 'An investigation into an alien meat supply forces Gwen to reveal the truth about Torchwood to Rhys.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 4, 'Torchwood 2x04 Carne Carne [Dual] [1080p].mkv', 4333533430)]
  },
  {
    title: 'Adam',
    season: 2,
    episode: 5,
    released: new Date('2008-02-13').toISOString(),
    overview: 'An alien who can manipulate memories infiltrates Torchwood and rewrites the team’s relationships and identities.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(2, 5, 'S02E05.clean.mp4', 3603134942)]
  },
  {
    title: 'Reset',
    season: 2,
    episode: 6,
    released: new Date('2008-02-13').toISOString(),
    overview: 'Martha Jones joins Torchwood to investigate mysterious deaths connected to a sinister medical research center.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 6, 'Torchwood 2x06 Restauración [Dual] [1080p].mkv', 4327703745)]
  },
  {
    title: 'Dead Man Walking',
    season: 2,
    episode: 7,
    released: new Date('2008-02-20').toISOString(),
    overview: 'Jack uses a resurrection gauntlet in a desperate attempt to save Owen, unleashing a primal force in the process.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 7, 'Torchwood 2x07 Muerto viviente [Dual] [1080p].mkv', 4329704217)]
  },
  {
    title: 'A Day in the Death',
    season: 2,
    episode: 8,
    released: new Date('2008-02-27').toISOString(),
    overview: 'Owen struggles with his changed existence while undertaking a mission to recover a dangerous alien device.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 8, 'Torchwood 2x08 Un día en la muerte [Dual] [1080p].mkv', 4326619782)]
  },
  {
    title: 'Something Borrowed',
    season: 2,
    episode: 9,
    released: new Date('2008-03-05').toISOString(),
    overview: 'Gwen’s wedding day is disrupted when an alien shapeshifter leaves her carrying an unexpected passenger.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(2, 9, 'S02E09.clean.mp4', 3722423202)]
  },
  {
    title: 'From Out of the Rain',
    season: 2,
    episode: 10,
    released: new Date('2008-03-12').toISOString(),
    overview: 'Nightmarish performers escape from an old film and stalk Cardiff, leaving their victims suspended between life and death.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 10, 'Torchwood 2x10 De entre la lluvia [Dual] [1080p].mkv', 4307599145)]
  },
  {
    title: 'Adrift',
    season: 2,
    episode: 11,
    released: new Date('2008-03-19').toISOString(),
    overview: 'Gwen investigates people who vanished through the Rift and uncovers a secret Jack has tried to keep hidden.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(2, 11, 'S02E11.clean.v2.mp4', 3292704929)]
  },
  {
    title: 'Fragments',
    season: 2,
    episode: 12,
    released: new Date('2008-03-21').toISOString(),
    overview: 'After an explosion traps the team, memories reveal how Jack, Toshiko, Ianto, and Owen each joined Torchwood.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 12, 'Torchwood 2x12 Fragmentos [Dual] [1080p].mkv', 4316410789)]
  },
  {
    title: 'Exit Wounds',
    season: 2,
    episode: 13,
    released: new Date('2008-04-04').toISOString(),
    overview: 'Captain John returns for revenge, sending Jack into the past while chaos and Weevils overwhelm Cardiff.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(2, 13, 'Torchwood 2x13 Heridas abiertas [Dual] [1080p].mkv', 4329255556)]
  },
  {
    title: 'Day One',
    season: 3,
    episode: 1,
    released: new Date('2009-07-06').toISOString(),
    overview: 'Every child on Earth suddenly stops and delivers a warning as a government conspiracy closes around Torchwood.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(3, 1, 'Torchwood 3x01 Los Niños de la Tierra - Día Uno [Dual] [1080p].mkv', 4359797772)]
  },
  {
    title: 'Day Two',
    season: 3,
    episode: 2,
    released: new Date('2009-07-07').toISOString(),
    overview: 'Hunted by their own government, the surviving Torchwood team is forced underground while the mystery of the 456 deepens.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(3, 2, 'Torchwood 3x02 Los Niños de la Tierra - Día Dos [Dual] [1080p].mkv', 4343937263)]
  },
  {
    title: 'Day Three',
    season: 3,
    episode: 3,
    released: new Date('2009-07-08').toISOString(),
    overview: 'The 456 arrive as Torchwood fights to protect its families and uncover the truth behind events in 1965.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(3, 3, 'Torchwood 3x03 Los Niños de la Tierra - Día Tres [Dual] [1080p].mkv', 4361382435)]
  },
  {
    title: 'Day Four',
    season: 3,
    episode: 4,
    released: new Date('2009-07-09').toISOString(),
    overview: 'The 456 reveal their demand, forcing Britain’s leaders and Torchwood into devastating moral choices.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(3, 4, 'Torchwood 3x04 Los Niños de la Tierra - Día Cuatro [Dual] [1080p].mkv', 4341104607)]
  },
  {
    title: 'Day Five',
    season: 3,
    episode: 5,
    released: new Date('2009-07-10').toISOString(),
    overview: 'With the world descending into violence, Gwen and Jack face a final sacrifice to stop the 456.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(3, 5, 'Torchwood 3x05 Los Niños de la Tierra - Día Cinco [Dual] [1080p].mkv', 4373237949)]
  },
  {
    title: 'The New World',
    season: 4,
    episode: 1,
    released: new Date('2011-07-08').toISOString(),
    overview: 'When death suddenly stops worldwide, CIA agent Rex Matheson follows the only clue he has: Torchwood.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 1, 'TorchWood 4x01 El Día del Milagro - El nuevo mundo [Dual] [1080p].mkv', 4339298287)]
  },
  {
    title: 'Rendition',
    season: 4,
    episode: 2,
    released: new Date('2011-07-15').toISOString(),
    overview: 'Torchwood is reunited aboard a flight to the United States, where Jack’s new vulnerability turns the journey into a fight for survival.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 2, 'TorchWood 4x02 El Día del Milagro - Extradicción [Dual] [1080p].mkv', 4339433303)]
  },
  {
    title: 'Dead of Night',
    season: 4,
    episode: 3,
    released: new Date('2011-07-22').toISOString(),
    overview: 'Torchwood raids PhiCorp while Jack confronts Oswald Danes and the team begins to uncover the machinery behind the Miracle.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(4, 3, 'S04E03.clean.mp4', 1527961852)]
  },
  {
    title: 'Escape to L.A.',
    season: 4,
    episode: 4,
    released: new Date('2011-07-29').toISOString(),
    overview: 'The investigation moves to California, where a deadly trap waits inside PhiCorp’s operations.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 4, 'TorchWood 4x04 El Día del Milagro - Escape a Los Angeles [Dual] [1080p].mkv', 4343733658)]
  },
  {
    title: 'The Categories of Life',
    season: 4,
    episode: 5,
    released: new Date('2011-08-05').toISOString(),
    overview: 'Torchwood goes undercover in the overflow camps and discovers the terrible truth behind the new categories of life.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 5, 'TorchWood 4x05 El Día del Milagro - Las categorías de la vida [Dual] [1080p].mkv', 4338695514)]
  },
  {
    title: 'The Middle Men',
    season: 4,
    episode: 6,
    released: new Date('2011-08-12').toISOString(),
    overview: 'The team battles the machinery of the overflow camps while Jack follows the conspiracy toward its hidden architects.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 6, 'TorchWood 4x06 El Día del Milagro - Hombres corrientes [Dual] [1080p].mkv', 4339356410)]
  },
  {
    title: 'Immortal Sins',
    season: 4,
    episode: 7,
    released: new Date('2011-08-19').toISOString(),
    overview: 'Gwen forces Jack to reveal how a relationship from his past became entwined with the origins of the Miracle.',
    thumbnail: POSTER_URL,
    streams: [buildCleanStream(4, 7, 'S04E07.clean.mp4', 1398554303)]
  },
  {
    title: 'End of the Road',
    season: 4,
    episode: 8,
    released: new Date('2011-08-26').toISOString(),
    overview: 'Jack confronts a man long thought dead while Rex takes extreme action against the conspiracy.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 8, 'TorchWood 4x08 El Día del Milagro - Fase terminal [Dual] [1080p].mkv', 4340262987)]
  },
  {
    title: 'The Gathering',
    season: 4,
    episode: 9,
    released: new Date('2011-09-02').toISOString(),
    overview: 'Months later, the scattered Torchwood team regroups and makes a dangerous bargain to find the Three Families.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 9, 'TorchWood 4x09 El Día del Milagro - El Reencuentro [Dual] [1080p].mkv', 4340860201)]
  },
  {
    title: 'The Blood Line',
    season: 4,
    episode: 10,
    released: new Date('2011-09-09').toISOString(),
    overview: 'Torchwood reaches the Blessing from opposite sides of the world and prepares a final sacrifice to end the Miracle.',
    thumbnail: POSTER_URL,
    streams: [buildOriginalStream(4, 10, 'TorchWood 4x10 El Día del Milagro - Línea de sangre [Dual] [1080p].mkv', 4341801970)]
  }
];

for (const episode of episodes) {
  const episodeId = `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
  episode.thumbnail = episodeImages[episodeId]?.url || episode.thumbnail;
}

module.exports = {
  ARCHIVE_IDENTIFIERS,
  POSTER_URL,
  episodes
};
