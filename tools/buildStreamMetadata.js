#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { performance } = require('perf_hooks');

const episodes = require('../episodeData');

const ROOT = path.resolve(__dirname, '..');
const METADATA_DIR = path.join(ROOT, '.subtitle-audit-cache', 'metadata');
const OUTPUT_PATH = path.join(ROOT, 'streamMetadata.json');

const MAX_CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const RANGE_HEADER_VALUE = 'bytes=0-262143';

function canonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex <= 1 ? 0 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function isSpecial(title = '') {
  return /special/i.test(title);
}

function parseArchiveItem(url) {
  const match = url.match(/archive\.org\/download\/([^/]+)\//i);
  return match ? match[1] : null;
}

function getStreamFilename(url) {
  return url ? url.split('/').pop() || null : null;
}

function qualityFromEntry(entry, { primary = false } = {}) {
  const width = Number(entry.width || 0);
  const height = Number(entry.height || 0);

  if (primary) {
    return '1080p';
  }

  if (height >= 1000 || width >= 1880) {
    return '1080p';
  }

  if (height >= 700 || width >= 1200) {
    return '720p';
  }

  return '480p';
}

function classifySpeed(probe) {
  if (!probe || ![200, 206].includes(probe.responseStatus)) {
    return 'BAD';
  }

  if (probe.startupScore <= 700) {
    return 'FAST';
  }

  if (probe.startupScore <= 1500) {
    return 'OK';
  }

  if (probe.startupScore <= 4000) {
    return 'SLOW';
  }

  return 'BAD';
}

function cloneAbortSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchWithRedirects(url, method = 'GET', redirects = 0, startedAt = performance.now()) {
  const { signal, clear } = cloneAbortSignal(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      redirect: 'manual',
      signal,
      headers: {
        'user-agent': 'WhoniverseArabicStreamAudit/1.0',
        Range: RANGE_HEADER_VALUE
      }
    });

    if (REDIRECT_STATUSES.has(response.status) && response.headers.get('location') && redirects < 5) {
      const nextUrl = new URL(response.headers.get('location'), url).toString();
      clear();
      return fetchWithRedirects(nextUrl, method, redirects + 1, startedAt);
    }

    clear();
    const responseTimeMs = Math.round(performance.now() - startedAt);
    let sampleBytes = 0;
    let sampleDownloadTimeMs = responseTimeMs;

    try {
      const buffer = Buffer.from(await response.arrayBuffer());
      sampleBytes = buffer.length;
      sampleDownloadTimeMs = Math.round(performance.now() - startedAt);
    } catch {
      sampleBytes = 0;
      sampleDownloadTimeMs = Math.round(performance.now() - startedAt);
    }

    return {
      responseStatus: response.status,
      responseTimeMs,
      sampleDownloadTimeMs,
      sampleBytes,
      startupScore: sampleDownloadTimeMs,
      redirects,
      finalUrl: response.url || url,
      contentLength: Number(response.headers.get('content-length') || 0) || null,
      contentType: response.headers.get('content-type') || null
    };
  } catch (error) {
    clear();
    return {
      responseStatus: 0,
      responseTimeMs: Math.round(performance.now() - startedAt),
      sampleDownloadTimeMs: Math.round(performance.now() - startedAt),
      sampleBytes: 0,
      startupScore: Math.round(performance.now() - startedAt),
      redirects,
      finalUrl: url,
      contentLength: null,
      contentType: null,
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  }
}

async function probeUrl(url) {
  let bestResult = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await fetchWithRedirects(url, 'GET');

    if (!bestResult) {
      bestResult = result;
    }

    if ([200, 206].includes(result.responseStatus) && result.responseTimeMs <= 8000) {
      if (!bestResult || bestResult.responseStatus === 0 || result.responseTimeMs < bestResult.responseTimeMs) {
        bestResult = result;
      }

      break;
    }

    if ([200, 206].includes(result.responseStatus)) {
      if (!bestResult || bestResult.responseStatus !== 200 && bestResult.responseStatus !== 206 || result.responseTimeMs < bestResult.responseTimeMs) {
        bestResult = result;
      }
    }
  }

  return bestResult;
}

async function chooseBestProbe(urls) {
  const probes = [];

  for (const url of urls) {
    const probe = await probeUrl(url);
    probes.push({ url, probe, healthScore: calculateHealthScore(probe) });
  }

  probes.sort((a, b) => {
    if (b.healthScore !== a.healthScore) {
      return b.healthScore - a.healthScore;
    }

    return a.probe.responseTimeMs - b.probe.responseTimeMs;
  });

  return {
    selected: probes[0] || null,
    all: probes
  };
}

async function mapWithConcurrency(items, iteratee) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function loadArchiveMetadata() {
  const files = await fsp.readdir(METADATA_DIR);
  const byItem = new Map();

  for (const file of files.filter((name) => name.endsWith('.json')).sort()) {
    const item = file.replace(/\.json$/i, '');
    const fullPath = path.join(METADATA_DIR, file);
    const data = JSON.parse(await fsp.readFile(fullPath, 'utf8'));
    const byName = new Map((data.files || []).map((entry) => [entry.name, entry]));
    byItem.set(item, { raw: data, byName });
  }

  return byItem;
}

function shouldExposeAlternative(primaryEntry, alternativeEntry) {
  const primarySize = Number(primaryEntry.size || 0);
  const alternativeSize = Number(alternativeEntry.size || 0);
  const runtimeDelta = Math.abs(Number(primaryEntry.length || 0) - Number(alternativeEntry.length || 0));
  const altQuality = qualityFromEntry(alternativeEntry);
  const sameRuntime = runtimeDelta <= 90;

  if (!primarySize || !alternativeSize || !sameRuntime) {
    return false;
  }

  if (altQuality === '1080p') {
    return alternativeSize <= primarySize * 0.95;
  }

  return alternativeSize < primarySize;
}

function candidateUrlsForFile(itemMetadata, publicUrl, filename) {
  const urls = new Set();
  if (publicUrl) {
    urls.add(publicUrl);
  }

  const raw = itemMetadata?.raw;
  if (!raw || !filename) {
    return [...urls];
  }

  for (const location of raw.alternate_locations?.workable || raw.alternate_locations?.servers || []) {
    if (location.server && location.dir) {
      urls.add(`https://${location.server}${location.dir}/${filename}`);
    }
  }

  for (const host of [raw.d1, raw.d2]) {
    if (host && raw.dir) {
      urls.add(`https://${host}${raw.dir}/${filename}`);
    }
  }

  return [...urls];
}

function makeAlternativeLabel(primaryEntry, alternativeEntry) {
  const altQuality = qualityFromEntry(alternativeEntry);
  const primaryQuality = qualityFromEntry(primaryEntry, { primary: true });
  return altQuality === primaryQuality ? 'Fast Start' : altQuality;
}

function calculateHealthScore(probe) {
  if (!probe || ![200, 206].includes(probe.responseStatus)) {
    return 0;
  }

  const responsePenalty = Math.min(70, Math.round(Math.min(probe.startupScore || probe.responseTimeMs, 10000) / 160));
  const redirectPenalty = Math.min(10, (probe.redirects || 0) * 3);
  return Math.max(1, 100 - responsePenalty - redirectPenalty);
}

function isSpeedAlternative(primary, alternative) {
  if (alternative.label !== '480p') {
    return false;
  }

  const primaryStartup = primary.startupScore || primary.responseTimeMs || Infinity;
  const alternativeStartup = alternative.startupScore || alternative.responseTimeMs || Infinity;

  return (
    alternativeStartup + 120 < primaryStartup &&
    alternativeStartup <= primaryStartup * 0.9
  );
}

function buildStreamEntry({ role, label, sourceType, url, probe, archiveEntry }) {
  const sizeBytes = Number(archiveEntry.size || 0) || probe.contentLength || null;
  return {
    role,
    label,
    sourceType,
    url,
    sizeBytes,
    sizeLabel: formatBytes(sizeBytes),
    responseStatus: probe.responseStatus,
    responseTimeMs: probe.responseTimeMs,
    redirects: probe.redirects,
    finalUrl: probe.finalUrl,
    host: probe.finalUrl ? new URL(probe.finalUrl).host : null,
    contentType: probe.contentType,
    speedCategory: classifySpeed(probe),
    healthScore: calculateHealthScore(probe),
    startupScore: probe.startupScore,
    sampleDownloadTimeMs: probe.sampleDownloadTimeMs,
    sampleBytes: probe.sampleBytes,
    width: Number(archiveEntry.width || 0) || null,
    height: Number(archiveEntry.height || 0) || null,
    lengthSeconds: Number(archiveEntry.length || 0) || null
  };
}

function preferSameQualityAlternative(primary, alternative) {
  if (alternative.healthScore > primary.healthScore + 3) {
    return true;
  }

  if (alternative.healthScore >= primary.healthScore && alternative.responseTimeMs + 250 < primary.responseTimeMs) {
    return true;
  }

  return false;
}

function primarySummarySpeed(summary, entry) {
  if (!summary.primary[entry.speedCategory]) {
    summary.primary[entry.speedCategory] = 0;
  }

  summary.primary[entry.speedCategory] += 1;
}

async function main() {
  const metadataByItem = await loadArchiveMetadata();
  const episodeRecords = [];

  for (const episode of episodes) {
    if (!episode.streamUrl) {
      continue;
    }

    const itemId = parseArchiveItem(episode.streamUrl);
    const filename = getStreamFilename(episode.streamUrl);
    const itemMetadata = itemId ? metadataByItem.get(itemId) : null;
    const primaryArchiveEntry = itemMetadata ? itemMetadata.byName.get(filename) : null;
    const alternativeFilename = filename ? filename.replace(/\.mp4$/i, '.ia.mp4') : null;
    const alternativeArchiveEntry = itemMetadata ? itemMetadata.byName.get(alternativeFilename) : null;

    episodeRecords.push({
      episode,
      canonicalId: canonicalId(episode),
      itemId,
      itemMetadata,
      filename,
      primaryArchiveEntry,
      alternativeFilename,
      alternativeArchiveEntry
    });
  }

  const probed = await mapWithConcurrency(episodeRecords, async (record) => {
    const primarySelection = await chooseBestProbe(
      candidateUrlsForFile(record.itemMetadata, record.episode.streamUrl, record.filename)
    );
    const altPublicUrl = record.alternativeFilename
      ? record.episode.streamUrl.replace(/\.mp4$/i, '.ia.mp4')
      : null;
    const altSelection = record.alternativeArchiveEntry
      ? await chooseBestProbe(candidateUrlsForFile(record.itemMetadata, altPublicUrl, record.alternativeFilename))
      : null;

    return {
      ...record,
      primarySelection,
      altSelection
    };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalEpisodes: probed.length,
      primary: {
        FAST: 0,
        OK: 0,
        SLOW: 0,
        BAD: 0
      },
      episodesWith1080p: 0,
      episodesWith720pAdded: 0,
      episodesWith480pAdded: 0,
      episodesWithFastStartBackup: 0,
      episodesWithTorrentFallback: 0
    },
    episodes: {}
  };

  for (const record of probed) {
    const { episode, canonicalId: id, primaryArchiveEntry, primarySelection, alternativeArchiveEntry, altSelection, itemId } = record;
    const primaryProbe = primarySelection?.selected?.probe || {
      responseStatus: 0,
      responseTimeMs: 0,
      redirects: 0,
      finalUrl: episode.streamUrl,
      contentLength: null,
      contentType: null
    };
    const primaryUrl = primarySelection?.selected?.url || episode.streamUrl;

    if (!primaryArchiveEntry) {
      output.episodes[id] = {
        canonicalId: id,
        title: episode.title,
        isSpecial: isSpecial(episode.title),
        archiveItem: itemId,
        primary: {
          role: 'primary',
          label: '1080p',
          sourceType: 'direct',
          url: primaryUrl,
          sizeBytes: null,
          sizeLabel: null,
          responseStatus: primaryProbe.responseStatus,
          responseTimeMs: primaryProbe.responseTimeMs,
          redirects: primaryProbe.redirects,
          finalUrl: primaryProbe.finalUrl,
          host: primaryProbe.finalUrl ? new URL(primaryProbe.finalUrl).host : null,
          contentType: primaryProbe.contentType,
          speedCategory: classifySpeed(primaryProbe),
          healthScore: calculateHealthScore(primaryProbe),
          width: null,
          height: null,
          lengthSeconds: null
        },
        alternatives: [],
        backupCandidates: [],
        primaryCandidates: primarySelection ? primarySelection.all : []
      };
      primarySummarySpeed(output.summary, output.episodes[id].primary);
      output.summary.episodesWith1080p += 1;
      continue;
    }

    let primary = buildStreamEntry({
      role: 'primary',
      label: '1080p',
      sourceType: 'direct',
      url: primaryUrl,
      probe: primaryProbe,
      archiveEntry: primaryArchiveEntry
    });

    const alternatives = [];
    const backupCandidates = [];

    if (alternativeArchiveEntry && altSelection?.selected) {
      const altProbe = altSelection.selected.probe;
      const altUrl = altSelection.selected.url;
      const label = makeAlternativeLabel(primaryArchiveEntry, alternativeArchiveEntry);
      const sourceType = label === 'Fast Start' ? 'direct-fast-start' : 'direct-derivative';
      const alternative = buildStreamEntry({
        role: 'alternative',
        label,
        sourceType,
        url: altUrl,
        probe: altProbe,
        archiveEntry: alternativeArchiveEntry
      });

      if (shouldExposeAlternative(primaryArchiveEntry, alternativeArchiveEntry) && [200, 206].includes(alternative.responseStatus)) {
        if (label === 'Fast Start') {
          if (preferSameQualityAlternative(primary, alternative)) {
            backupCandidates.push(primary);
            primary = {
              ...alternative,
              role: 'primary',
              label: '1080p'
            };
          } else {
            backupCandidates.push(alternative);
          }
          output.summary.episodesWithFastStartBackup += 1;
        } else if (isSpeedAlternative(primary, alternative)) {
          backupCandidates.push(alternative);
          alternatives.push(alternative);
        } else {
          backupCandidates.push(alternative);
        }
      } else {
        backupCandidates.push(alternative);
      }
    }

    output.episodes[id] = {
      canonicalId: id,
      title: episode.title,
      isSpecial: isSpecial(episode.title),
      archiveItem: itemId,
      primary,
      alternatives,
      backupCandidates,
      primaryCandidates: primarySelection ? primarySelection.all : []
    };

    primarySummarySpeed(output.summary, primary);
    output.summary.episodesWith1080p += 1;

    if (alternatives.some((entry) => entry.label === '720p')) {
      output.summary.episodesWith720pAdded += 1;
    }

    if (alternatives.some((entry) => entry.label === '480p')) {
      output.summary.episodesWith480pAdded += 1;
    }

  }

  await fsp.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(output.summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
