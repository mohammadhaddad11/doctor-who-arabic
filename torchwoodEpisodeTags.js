const { formatEpisodeTagLabel } = require('./episodeTagMetadata');

const TORCHWOOD_EPISODE_TAGS = Object.freeze({
  S01E01: Object.freeze({ title: 'Everything Changes', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'drama', qualityNote: 'strong', contentNote: 'mature', comment: 'Introduces Gwen and the Torchwood team.' }),
  S01E02: Object.freeze({ title: 'Day One', importance: 'skippable', cleanStatus: 'unavailable', continuity: 'standalone', tone: 'drama', qualityNote: 'okay', contentNote: 'skipped', comment: 'Unavailable in this addon.' }),
  S01E03: Object.freeze({ title: 'Ghost Machine', importance: 'optional', cleanStatus: 'original', continuity: 'standalone', tone: 'thriller', qualityNote: 'good', contentNote: 'mature', comment: 'A focused investigation with character weight.' }),
  S01E04: Object.freeze({ title: 'Cyberwoman', importance: 'important', cleanStatus: 'original', continuity: 'character-focused', tone: 'horror', qualityNote: 'controversial', contentNote: 'mature', comment: 'Important development for Ianto and the team.' }),
  S01E05: Object.freeze({ title: 'Small Worlds', importance: 'optional', cleanStatus: 'original', continuity: 'standalone', tone: 'horror', qualityNote: 'good', contentNote: 'mature', comment: "A dark case linked to Jack's past." }),
  S01E06: Object.freeze({ title: 'Countrycide', importance: 'optional', cleanStatus: 'original', continuity: 'standalone', tone: 'horror', qualityNote: 'strong', contentNote: 'mature', comment: 'A notably dark standalone investigation.' }),
  S01E07: Object.freeze({ title: 'Greeks Bearing Gifts', importance: 'important', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'good', contentNote: 'mature', comment: 'A Toshiko-focused character story.' }),
  S01E08: Object.freeze({ title: 'They Keep Killing Suzie', importance: 'important', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'strong', contentNote: 'mature', comment: 'Revisits consequences from the series opening.' }),
  S01E09: Object.freeze({ title: 'Random Shoes', importance: 'optional', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'good', contentNote: 'mature', comment: 'A reflective character-led standalone.' }),
  S01E10: Object.freeze({ title: 'Out of Time', importance: 'important', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'moderated', comment: 'A strong emotional team story.' }),
  S01E11: Object.freeze({ title: 'Combat', importance: 'important', cleanStatus: 'original', continuity: 'character-focused', tone: 'thriller', qualityNote: 'good', contentNote: 'mature', comment: 'A dark Owen-focused episode.' }),
  S01E12: Object.freeze({ title: 'Captain Jack Harkness', importance: 'essential', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'mature', comment: 'Major character context for Jack and Toshiko.' }),
  S01E13: Object.freeze({ title: 'End of Days', importance: 'essential', cleanStatus: 'clean-cut', continuity: 'main-arc', tone: 'action', qualityNote: 'okay', contentNote: 'moderated', comment: 'Season finale and core continuity.' }),

  S02E01: Object.freeze({ title: 'Kiss Kiss, Bang Bang', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'good', contentNote: 'mature', comment: "Re-establishes the team and Jack's history." }),
  S02E02: Object.freeze({ title: 'Sleeper', importance: 'important', cleanStatus: 'original', continuity: 'standalone', tone: 'thriller', qualityNote: 'good', contentNote: 'mature', comment: 'A tense investigation with wider stakes.' }),
  S02E03: Object.freeze({ title: 'To the Last Man', importance: 'important', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'moderated', comment: 'A major Toshiko character episode.' }),
  S02E04: Object.freeze({ title: 'Meat', importance: 'important', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'good', contentNote: 'mature', comment: 'Important development for Gwen and Rhys.' }),
  S02E05: Object.freeze({ title: 'Adam', importance: 'important', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'thriller', qualityNote: 'strong', contentNote: 'moderated', comment: "Explores the team's memories and relationships." }),
  S02E06: Object.freeze({ title: 'Reset', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'good', contentNote: 'mature', comment: 'Begins a major mid-season storyline.' }),
  S02E07: Object.freeze({ title: 'Dead Man Walking', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'horror', qualityNote: 'good', contentNote: 'mature', comment: 'Direct continuation of the season arc.' }),
  S02E08: Object.freeze({ title: 'A Day in the Death', importance: 'essential', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'mature', comment: 'Strong character follow-up to the preceding story.' }),
  S02E09: Object.freeze({ title: 'Something Borrowed', importance: 'optional', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'horror', qualityNote: 'good', contentNote: 'moderated', comment: 'A Gwen and Rhys character story.' }),
  S02E10: Object.freeze({ title: 'From Out of the Rain', importance: 'optional', cleanStatus: 'original', continuity: 'standalone', tone: 'horror', qualityNote: 'good', contentNote: 'mature', comment: 'An atmospheric standalone investigation.' }),
  S02E11: Object.freeze({ title: 'Adrift', importance: 'important', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'moderated', comment: 'A major Gwen and Jack character episode.' }),
  S02E12: Object.freeze({ title: 'Fragments', importance: 'essential', cleanStatus: 'original', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'mature', comment: 'Essential background for the Torchwood team.' }),
  S02E13: Object.freeze({ title: 'Exit Wounds', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'strong', contentNote: 'mature', comment: 'Season finale with lasting consequences.' }),

  S03E01: Object.freeze({ title: 'Day One', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'strong', contentNote: 'mature', comment: 'Begins the Children of Earth storyline.' }),
  S03E02: Object.freeze({ title: 'Day Two', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'strong', contentNote: 'mature', comment: 'Essential continuation of Children of Earth.' }),
  S03E03: Object.freeze({ title: 'Day Three', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'strong', contentNote: 'mature', comment: 'Central Children of Earth escalation.' }),
  S03E04: Object.freeze({ title: 'Day Four', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'dark', qualityNote: 'strong', contentNote: 'mature', comment: 'Critical Children of Earth chapter.' }),
  S03E05: Object.freeze({ title: 'Day Five', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'drama', qualityNote: 'strong', contentNote: 'mature', comment: 'Concludes the Children of Earth storyline.' }),

  S04E01: Object.freeze({ title: 'The New World', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'good', contentNote: 'mature', comment: 'Begins the Miracle Day storyline.' }),
  S04E02: Object.freeze({ title: 'Rendition', importance: 'important', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'okay', contentNote: 'mature', comment: 'Continues the serialized Miracle Day arc.' }),
  S04E03: Object.freeze({ title: 'Dead of Night', importance: 'important', cleanStatus: 'clean-cut', continuity: 'main-arc', tone: 'thriller', qualityNote: 'okay', contentNote: 'moderated', comment: 'Advances the Miracle Day investigation.' }),
  S04E04: Object.freeze({ title: 'Escape to L.A.', importance: 'important', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'okay', contentNote: 'mature', comment: 'Continues the serialized investigation.' }),
  S04E05: Object.freeze({ title: 'The Categories of Life', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'dark', qualityNote: 'strong', contentNote: 'mature', comment: 'A central chapter in the Miracle Day arc.' }),
  S04E06: Object.freeze({ title: 'The Middle Men', importance: 'important', cleanStatus: 'original', continuity: 'main-arc', tone: 'drama', qualityNote: 'good', contentNote: 'mature', comment: 'Connects the investigation to its wider conspiracy.' }),
  S04E07: Object.freeze({ title: 'Immortal Sins', importance: 'essential', cleanStatus: 'clean-cut', continuity: 'character-focused', tone: 'drama', qualityNote: 'strong', contentNote: 'moderated', comment: 'Essential Jack-focused history and context.' }),
  S04E08: Object.freeze({ title: 'End of the Road', importance: 'important', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'okay', contentNote: 'mature', comment: 'Moves the Miracle Day arc toward its endgame.' }),
  S04E09: Object.freeze({ title: 'The Gathering', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'thriller', qualityNote: 'good', contentNote: 'mature', comment: 'Finale setup for the Miracle Day arc.' }),
  S04E10: Object.freeze({ title: 'The Blood Line', importance: 'essential', cleanStatus: 'original', continuity: 'main-arc', tone: 'action', qualityNote: 'controversial', contentNote: 'mature', comment: 'Concludes the Miracle Day storyline.' })
});

function buildTorchwoodEpisodeTagLine(tag) {
  if (!tag) {
    return '';
  }

  const labels = [tag.cleanStatus, tag.importance, tag.continuity, tag.tone]
    .map((value) => `[${formatEpisodeTagLabel(value)}]`);
  labels.push(`[Quality: ${formatEpisodeTagLabel(tag.qualityNote)}]`);
  labels.push(`[Content: ${formatEpisodeTagLabel(tag.contentNote)}]`);
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
