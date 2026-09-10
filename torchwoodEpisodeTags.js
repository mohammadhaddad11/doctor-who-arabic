const { formatEpisodeTagLabel } = require('./episodeTagMetadata');

const CONTENT_LABELS = Object.freeze({
  mild: 'Mild',
  'kissing-romance': 'Kissing/Romance',
  'sexual-themes': 'Sexual themes',
  'sexual-scene-removed': 'Sexual scene removed',
  'strong-violence': 'Strong violence',
  'horror-violence': 'Horror/Violence',
  'mature-language': 'Mature language',
  'disturbing-themes': 'Disturbing themes',
  skipped: 'Skipped'
});

const TORCHWOOD_EPISODE_TAGS = Object.freeze({
  S01E01: Object.freeze({ title: 'Everything Changes', importance: 'essential', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Series introduction and main arc setup.' }),
  S01E02: Object.freeze({ title: 'Day One', importance: 'skippable', cleanStatus: 'unavailable', contentNote: 'skipped', comment: 'Listed for continuity only; no stream is provided.' }),
  S01E03: Object.freeze({ title: 'Ghost Machine', importance: 'optional', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Optional standalone episode.' }),
  S01E04: Object.freeze({ title: 'Cyberwoman', importance: 'important', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Important Ianto-focused episode.' }),
  S01E05: Object.freeze({ title: 'Small Worlds', importance: 'optional', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Optional standalone episode.' }),
  S01E06: Object.freeze({ title: 'Countrycide', importance: 'optional', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'A notably dark standalone episode.' }),
  S01E07: Object.freeze({ title: 'Greeks Bearing Gifts', importance: 'important', cleanStatus: 'original', contentNote: 'sexual-themes', comment: 'Important Toshiko-focused episode.' }),
  S01E08: Object.freeze({ title: 'They Keep Killing Suzie', importance: 'important', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Main arc follow-up.' }),
  S01E09: Object.freeze({ title: 'Random Shoes', importance: 'optional', cleanStatus: 'original', contentNote: 'mild', comment: 'Optional standalone episode.' }),
  S01E10: Object.freeze({ title: 'Out of Time', importance: 'important', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S01E11: Object.freeze({ title: 'Combat', importance: 'important', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Important Owen-focused episode.' }),
  S01E12: Object.freeze({ title: 'Captain Jack Harkness', importance: 'essential', cleanStatus: 'original', contentNote: 'kissing-romance', comment: 'Essential character background.' }),
  S01E13: Object.freeze({ title: 'End of Days', importance: 'essential', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Season finale and main arc episode.' }),

  S02E01: Object.freeze({ title: 'Kiss Kiss, Bang Bang', importance: 'essential', cleanStatus: 'original', contentNote: 'sexual-themes', comment: 'Season opener and main arc setup.' }),
  S02E02: Object.freeze({ title: 'Sleeper', importance: 'important', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Important investigation episode.' }),
  S02E03: Object.freeze({ title: 'To the Last Man', importance: 'important', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S02E04: Object.freeze({ title: 'Meat', importance: 'important', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Important Gwen and Rhys episode.' }),
  S02E05: Object.freeze({ title: 'Adam', importance: 'important', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S02E06: Object.freeze({ title: 'Reset', importance: 'essential', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Begins an essential story arc.' }),
  S02E07: Object.freeze({ title: 'Dead Man Walking', importance: 'essential', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Main arc episode.' }),
  S02E08: Object.freeze({ title: 'A Day in the Death', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Essential character episode.' }),
  S02E09: Object.freeze({ title: 'Something Borrowed', importance: 'optional', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S02E10: Object.freeze({ title: 'From Out of the Rain', importance: 'optional', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Optional standalone episode.' }),
  S02E11: Object.freeze({ title: 'Adrift', importance: 'important', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S02E12: Object.freeze({ title: 'Fragments', importance: 'essential', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Essential team background.' }),
  S02E13: Object.freeze({ title: 'Exit Wounds', importance: 'essential', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Season finale and main arc episode.' }),

  S03E01: Object.freeze({ title: 'Day One', importance: 'essential', cleanStatus: 'original', contentNote: 'horror-violence', comment: 'Begins the season-long main arc.' }),
  S03E02: Object.freeze({ title: 'Day Two', importance: 'essential', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Main arc episode.' }),
  S03E03: Object.freeze({ title: 'Day Three', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Main arc episode.' }),
  S03E04: Object.freeze({ title: 'Day Four', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Main arc episode.' }),
  S03E05: Object.freeze({ title: 'Day Five', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Concludes the season-long main arc.' }),

  S04E01: Object.freeze({ title: 'The New World', importance: 'essential', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Begins the season-long main arc.' }),
  S04E02: Object.freeze({ title: 'Rendition', importance: 'important', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Main arc episode.' }),
  S04E03: Object.freeze({ title: 'Dead of Night', importance: 'important', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S04E04: Object.freeze({ title: 'Escape to L.A.', importance: 'important', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Main arc episode.' }),
  S04E05: Object.freeze({ title: 'The Categories of Life', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Main arc episode.' }),
  S04E06: Object.freeze({ title: 'The Middle Men', importance: 'important', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Main arc episode.' }),
  S04E07: Object.freeze({ title: 'Immortal Sins', importance: 'essential', cleanStatus: 'clean-cut', contentNote: 'sexual-scene-removed', comment: 'Clean-cut version used for a smoother watch.' }),
  S04E08: Object.freeze({ title: 'End of the Road', importance: 'important', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Main arc episode.' }),
  S04E09: Object.freeze({ title: 'The Gathering', importance: 'essential', cleanStatus: 'original', contentNote: 'disturbing-themes', comment: 'Main arc episode.' }),
  S04E10: Object.freeze({ title: 'The Blood Line', importance: 'essential', cleanStatus: 'original', contentNote: 'strong-violence', comment: 'Concludes the season-long main arc.' })
});

function buildTorchwoodEpisodeTagLine(tag) {
  if (!tag) {
    return '';
  }

  const labels = [tag.importance, tag.cleanStatus]
    .map((value) => `[${formatEpisodeTagLabel(value)}]`);
  labels.push(`[Content: ${CONTENT_LABELS[tag.contentNote] || formatEpisodeTagLabel(tag.contentNote)}]`);
  return labels.join(' ');
}

function buildTorchwoodEpisodeOverview(episode, tag) {
  const tagLine = buildTorchwoodEpisodeTagLine(tag);
  if (!tagLine || !episode?.overview) {
    return episode?.overview;
  }

  const comment = typeof tag.comment === 'string' && tag.comment.trim()
    ? ` ${tag.comment.trim()}`
    : '';
  return `${tagLine}${comment} — ${episode.overview}`;
}

function buildTorchwoodStreamDescription(stream, tag) {
  if (!tag || !stream?.description) {
    return stream?.description;
  }

  return `[${formatEpisodeTagLabel(tag.cleanStatus)}] [1080p] • ${stream.description}`;
}

module.exports = {
  TORCHWOOD_EPISODE_TAGS,
  buildTorchwoodEpisodeOverview,
  buildTorchwoodEpisodeTagLine,
  buildTorchwoodStreamDescription
};
