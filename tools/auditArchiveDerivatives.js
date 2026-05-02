#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodeData = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');

const ROOT = path.resolve(__dirname, '..');
const CACHE_METADATA_DIR = path.join(ROOT, '.subtitle-audit-cache', 'metadata');
const REPORT_PATH = path.join(ROOT, 'audit', 'archive-derivative-audit.json');

const REQUEST_TIMEOUT_MS = 5000;
const RANGE_HEADER = 'bytes=0-65535';
const MAX_CANDIDATES_PER_EPISODE = 6;
const MAX_PROBE_CANDIDATES = 5;
const MAX_CONCURRENCY = 4;

function canonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function parseArchiveItem(url) {
  const match = String(url || '').match(/archive\.org\/download\/([^/]+)\//i);
  return match ? match[1] : null;
}

function fileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    return path.basename(parsed.pathname);
  } catch {
    return null;
  }
}

function getEpisodeMap() {
  return new Map(episodeData.map((episode) => [canonicalId(episode), episode]));
}

function isProblemEpisode(metadataEntry) {
  const primary = metadataEntry?.primary;
  if (!primary) {
    return false;
  }

  return primary.speedCategory === 'SLOW'
    || (primary.healthScore || 0) <= 90
    || (primary.startupScore || Infinity) >= 1500;
}

function readArchiveMetadata(itemId) {
  if (!itemId) {
    return null;
  }

  const filePath = path.join(CACHE_METADATA_DIR, `${itemId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildCandidateUrls(episode, metadataEntry) {
  const candidates = new Map();

  function add(url, label, source) {
    if (!url || typeof url !== 'string' || candidates.has(url)) {
      return;
    }
    candidates.set(url, { url, label, source });
  }

  const primaryUrl = metadataEntry?.primary?.url || episode.streamUrl;
  if (primaryUrl) {
    add(primaryUrl, 'primary', 'metadata-primary');

    if (/\.mp4($|\?)/i.test(primaryUrl)) {
      add(primaryUrl.replace(/\.mp4(\?.*)?$/i, '.ia.mp4$1'), 'ia-pattern', 'pattern');
    }
  }

  for (const entry of metadataEntry?.alternatives || []) {
    if (entry?.url) {
      add(entry.url, `metadata-${entry.label || 'alternative'}`, 'metadata-alternative');
    }
  }

  for (const entry of metadataEntry?.backupCandidates || []) {
    if (entry?.url) {
      add(entry.url, `metadata-backup-${entry.label || 'candidate'}`, 'metadata-backup');
    }
  }

  const itemId = parseArchiveItem(episode.streamUrl || primaryUrl);
  const primaryFilename = fileNameFromUrl(episode.streamUrl || primaryUrl);
  const archiveMetadata = readArchiveMetadata(itemId);

  if (archiveMetadata && primaryFilename) {
    const files = Array.isArray(archiveMetadata.files) ? archiveMetadata.files : [];
    const primaryFile = files.find((entry) => entry?.name === primaryFilename);
    const primarySize = Number(primaryFile?.size || 0);
    const base = primaryFilename.replace(/\.mp4$/i, '');

    for (const file of files) {
      if (!file?.name || !/\.mp4$/i.test(file.name) || file.name === primaryFilename) {
        continue;
      }

      if (!file.name.startsWith(base)) {
        continue;
      }

      const candidateSize = Number(file.size || 0);
      if (primarySize > 0 && candidateSize > 0 && candidateSize >= primarySize) {
        continue;
      }

      const archiveUrl = `https://archive.org/download/${itemId}/${encodeURIComponent(file.name)}`;
      add(archiveUrl, `archive-file-${file.name}`, 'archive-metadata');
    }
  }

  return [...candidates.values()].slice(0, MAX_CANDIDATES_PER_EPISODE);
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhoniverseArchiveDerivativeAudit/1.0',
        Range: RANGE_HEADER
      }
    });

    const ttfbMs = Date.now() - startedAt;
    let sampleBytes = 0;
    try {
      const buffer = Buffer.from(await response.arrayBuffer());
      sampleBytes = buffer.length;
    } catch {
      sampleBytes = 0;
    }

    clearTimeout(timer);

    const contentLength = Number(response.headers.get('content-length') || 0) || null;
    const contentType = response.headers.get('content-type') || null;
    const acceptRanges = (response.headers.get('accept-ranges') || '').toLowerCase();
    const contentRange = response.headers.get('content-range') || null;
    const rangeSupported = response.status === 206 || Boolean(contentRange) || acceptRanges.includes('bytes');

    return {
      status: response.status,
      ttfbMs,
      startupMs: Date.now() - startedAt,
      sampleBytes,
      contentLength,
      contentType,
      rangeSupported,
      finalUrl: response.url || url
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      status: 0,
      ttfbMs: Date.now() - startedAt,
      startupMs: Date.now() - startedAt,
      sampleBytes: 0,
      contentLength: null,
      contentType: null,
      rangeSupported: false,
      finalUrl: url,
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  }
}

async function mapWithConcurrency(items, iteratee, concurrency = MAX_CONCURRENCY) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await iteratee(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const episodeMap = getEpisodeMap();
  const metadataEpisodes = streamMetadata.episodes || {};

  const targets = Object.entries(metadataEpisodes)
    .filter(([, entry]) => isProblemEpisode(entry))
    .map(([canonicalIdValue, entry]) => ({
      canonicalId: canonicalIdValue,
      metadata: entry,
      episode: episodeMap.get(canonicalIdValue)
    }))
    .filter((entry) => entry.episode && entry.episode.streamUrl);

  const entries = await mapWithConcurrency(targets, async (target) => {
    const baselineStartupMs = target.metadata?.primary?.startupScore || null;
    const candidates = buildCandidateUrls(target.episode, target.metadata).slice(0, MAX_PROBE_CANDIDATES);

    const probedCandidates = [];
    for (const candidate of candidates) {
      const probe = await probeUrl(candidate.url);
      probedCandidates.push({
        ...candidate,
        ...probe,
        isHealthy: [200, 206].includes(probe.status) && probe.rangeSupported,
        fasterThanPrimary: Number.isFinite(baselineStartupMs)
          ? probe.startupMs + 120 < baselineStartupMs
          : false
      });
    }

    const usefulCandidates = probedCandidates
      .filter((candidate) => candidate.isHealthy && candidate.fasterThanPrimary)
      .sort((a, b) => a.startupMs - b.startupMs);

    return {
      canonicalId: target.canonicalId,
      title: target.episode.title,
      baseline: {
        primaryUrl: target.metadata?.primary?.url || target.episode.streamUrl,
        primaryStartupMs: baselineStartupMs,
        primarySpeedCategory: target.metadata?.primary?.speedCategory || null,
        primaryHealthScore: target.metadata?.primary?.healthScore || null
      },
      candidates: probedCandidates,
      fasterCandidates: usefulCandidates,
      bestCandidate: usefulCandidates[0] || null
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      targetEpisodes: targets.length,
      episodesWithFasterCandidate: entries.filter((entry) => entry.bestCandidate).length,
      candidateChecks: entries.reduce((count, entry) => count + entry.candidates.length, 0),
      healthyCandidates: entries.reduce((count, entry) => count + entry.candidates.filter((candidate) => candidate.isHealthy).length, 0)
    },
    entries
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
