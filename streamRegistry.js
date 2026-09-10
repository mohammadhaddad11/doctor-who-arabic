const { formatEpisodeTagLabel } = require('./episodeTagMetadata');

function attachSubtitlesToStream(stream, subtitles, { includeEmpty = false } = {}) {
  const tracks = [...(Array.isArray(stream.subtitles) ? stream.subtitles : [])];
  for (const subtitle of subtitles || []) {
    if (!tracks.some((existing) => existing.id === subtitle.id || existing.url === subtitle.url)) {
      tracks.push(subtitle);
    }
  }
  if (!tracks.length && !includeEmpty) {
    return { ...stream };
  }
  return { ...stream, subtitles: tracks };
}

function buildTorchwoodStreamDescription(stream, tag) {
  if (!tag || !stream?.description) {
    return stream?.description;
  }
  return `[${formatEpisodeTagLabel(tag.cleanStatus)}] [1080p] • ${stream.description}`;
}

function createStreamRegistry({
  getEpisodeKey,
  getMetadataBackedStreams,
  shouldUseDynamicRedirect,
  buildVideoRedirectUrl,
  getStreamBytes,
  getTorrentFallbackForEpisode,
  buildTrackerSources,
  showTorrentFallback,
  isSpecialEpisode,
  episodeTags,
  buildEpisodeTagLine,
  subtitleRegistry
}) {
  function buildTaggedDescription(episode, description) {
    const tagLine = buildEpisodeTagLine(episodeTags[getEpisodeKey(episode)]);
    return tagLine ? `${tagLine} • ${description}` : description;
  }

  function buildTorrentFallbackStream(entry, subtitles, episode) {
    const stream = attachSubtitlesToStream({
      name: 'Torrent Fallback',
      description: buildTaggedDescription(
        episode,
        `Whoniverse Arabic • fallback only • ${entry.quality} • subtitles: English + Arabic`
      ),
      infoHash: entry.infoHash,
      fileIdx: entry.fileIdx,
      behaviorHints: { notWebReady: true }
    }, subtitles, { includeEmpty: true });
    const sources = buildTrackerSources(entry);
    return sources.length ? { ...stream, sources } : stream;
  }

  function buildStreamLabel(streamEntry) {
    const prefix = streamEntry.label === '480p' ? '480p Speed' : '1080p Quality';
    return streamEntry.sizeLabel ? `${prefix} • ${streamEntry.sizeLabel}` : prefix;
  }

  function buildDoctorWhoStreamDescription(streamEntry, episode) {
    const parts = ['Whoniverse Arabic'];
    if (isSpecialEpisode(episode)) {
      parts.push('Special episode');
    }
    parts.push(streamEntry.label === '480p' ? 'Speed' : 'Quality');
    parts.push(`Source health ${streamEntry.healthScore || 0}/100`);
    parts.push('Subtitles: English + Arabic');
    return buildTaggedDescription(episode, parts.join(' • '));
  }

  function buildDoctorWhoStreams(episode) {
    if (!episode?.streamUrl) {
      return [];
    }
    const subtitles = subtitleRegistry.getDoctorWhoEpisodeSubtitles(episode);
    const metadataStreams = getMetadataBackedStreams(episode);
    if (metadataStreams.length) {
      const streams = metadataStreams.map((entry) => {
        const stream = attachSubtitlesToStream({
          url: shouldUseDynamicRedirect(episode, entry)
            ? buildVideoRedirectUrl(episode, entry.label)
            : entry.url,
          name: buildStreamLabel(entry),
          description: buildDoctorWhoStreamDescription(entry, episode)
        }, subtitles, { includeEmpty: true });
        const bytes = getStreamBytes(entry);
        return bytes === null ? stream : { ...stream, bytes };
      });
      const fallback = showTorrentFallback ? getTorrentFallbackForEpisode(episode) : null;
      if (fallback) {
        streams.push(buildTorrentFallbackStream(fallback, subtitles, episode));
      }
      return streams;
    }
    return [attachSubtitlesToStream({
      url: episode.streamUrl,
      name: '1080p Quality',
      description: buildTaggedDescription(
        episode,
        isSpecialEpisode(episode) ? 'Whoniverse Arabic • Special episode • Quality' : 'Whoniverse Arabic • Quality'
      )
    }, subtitles, { includeEmpty: true })];
  }

  function buildTorchwoodStreams(episode, tag) {
    const subtitles = subtitleRegistry.getTorchwoodCleanSubtitles(episode);
    return episode.streams.map((stream) => attachSubtitlesToStream({
      ...stream,
      description: buildTorchwoodStreamDescription(stream, tag)
    }, subtitles));
  }

  function buildMovieStreams(movie) {
    const subtitles = subtitleRegistry.getMovie1996Subtitles();
    return movie.streams.map((stream) => attachSubtitlesToStream(stream, subtitles));
  }

  return Object.freeze({
    buildDoctorWhoStreams,
    buildMovieStreams,
    buildTorchwoodStreams
  });
}

module.exports = {
  attachSubtitlesToStream,
  buildTorchwoodStreamDescription,
  createStreamRegistry
};
