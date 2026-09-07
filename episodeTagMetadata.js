const DEFAULT_EPISODE_GENRES = Object.freeze(['Sci-Fi', 'Adventure', 'Drama']);

function formatEpisodeTagLabel(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildEpisodeTagLine(tag) {
  if (!tag) {
    return '';
  }

  const labels = [tag.importance, tag.watchNote]
    .map((value) => `[${formatEpisodeTagLabel(value)}]`);
  if (tag.qualityNote) {
    labels.push(`[Quality: ${formatEpisodeTagLabel(tag.qualityNote)}]`);
  }
  return labels.join(' ');
}

function buildEpisodeTagMetadata(episode, tag) {
  const genres = Array.isArray(episode?.genres)
    ? [...episode.genres]
    : [...DEFAULT_EPISODE_GENRES];
  const tagLine = buildEpisodeTagLine(tag);
  const comment = typeof tag?.comment === 'string' && tag.comment.trim()
    ? ` ${tag.comment.trim()}`
    : '';

  return {
    overview: tagLine && episode?.overview
      ? `${tagLine}${comment} — ${episode.overview}`
      : episode?.overview,
    genres
  };
}

module.exports = {
  DEFAULT_EPISODE_GENRES,
  buildEpisodeTagLine,
  buildEpisodeTagMetadata,
  formatEpisodeTagLabel
};
