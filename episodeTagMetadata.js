const DEFAULT_EPISODE_GENRES = Object.freeze(['Sci-Fi', 'Adventure', 'Drama']);

function formatEpisodeTagLabel(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildEpisodeTagMetadata(episode, tag) {
  const genres = Array.isArray(episode?.genres)
    ? [...episode.genres]
    : [...DEFAULT_EPISODE_GENRES];

  if (tag) {
    genres.push(formatEpisodeTagLabel(tag.importance));
    genres.push(formatEpisodeTagLabel(tag.watchNote));
    if (tag.qualityNote) {
      genres.push(`Quality: ${formatEpisodeTagLabel(tag.qualityNote)}`);
    }
  }

  return {
    overview: episode?.overview,
    genres
  };
}

module.exports = {
  DEFAULT_EPISODE_GENRES,
  buildEpisodeTagMetadata,
  formatEpisodeTagLabel
};
