#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodeData = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');

const ROOT = path.resolve(__dirname, '..');
const INPUT_PATH = path.join(ROOT, 'externalSources.json');
const OUTPUT_PATH = path.join(ROOT, 'audit', 'external-source-validation.json');

const REQUEST_TIMEOUT_MS = 6000;
const RANGE_HEADER = 'bytes=0-65535';
const ALLOWED_SUBTITLE_COMPAT = new Set(['matches-current-archive-timing']);
const MEDIA_EXTENSIONS = new Set(['.mp4', '.mkv', '.webm', '.m4v', '.mov']);

function canonicalId(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function loadInput() {
  if (!fs.existsSync(INPUT_PATH)) {
    process.stdout.write('No externalSources.json found. Copy externalSources.example.json to externalSources.json and fill your candidates.\n');
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse externalSources.json: ${error.message}`);
  }
}

function toSourcesArray(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.sources)) {
    return data.sources;
  }

  return [];
}

function hasExpiringToken(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const queryKeys = [...parsed.searchParams.keys()].map((key) => key.toLowerCase());
    return queryKeys.some((key) => /token|sig|signature|expires|expiry|exp|x-amz|policy|key-pair-id|auth/.test(key));
  } catch {
    return true;
  }
}

function isDirectMediaUrl(urlValue) {
  try {
    const parsed = new URL(urlValue);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return false;
    }

    const extension = path.extname(parsed.pathname).toLowerCase();
    return MEDIA_EXTENSIONS.has(extension);
  } catch {
    return false;
  }
}

function normalizeTitle(value) {
  return String(value || '').trim().toLowerCase();
}

async function probeSource(urlValue) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(urlValue, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'WhoniverseExternalSourceValidator/1.0',
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
    const setCookie = response.headers.get('set-cookie');
    const wwwAuthenticate = response.headers.get('www-authenticate');

    return {
      status: response.status,
      ttfbMs,
      startupMs: Date.now() - startedAt,
      sampleBytes,
      contentLength,
      contentType,
      rangeSupported: response.status === 206 || Boolean(contentRange) || acceptRanges.includes('bytes'),
      hasLoginHeaders: Boolean(setCookie || wwwAuthenticate),
      finalUrl: response.url || urlValue
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
      hasLoginHeaders: false,
      finalUrl: urlValue,
      error: error.name === 'AbortError' ? 'timeout' : error.message
    };
  }
}

function getEpisodeMap() {
  return new Map(episodeData.map((episode) => [canonicalId(episode), episode]));
}

async function main() {
  const data = loadInput();
  if (!data) {
    process.exit(0);
  }

  const sources = toSourcesArray(data);
  const episodeMap = getEpisodeMap();
  const metadataEpisodes = streamMetadata.episodes || {};

  const accepted = [];
  const rejected = [];

  for (const source of sources) {
    const reasons = [];
    const canonical = source?.canonicalId;
    const episode = episodeMap.get(canonical);
    const metadataEntry = metadataEpisodes[canonical] || null;
    const baselineStartup = metadataEntry?.primary?.startupScore || null;

    if (!canonical || !episode) {
      reasons.push('wrong episode metadata (unknown canonicalId)');
    }

    if (!isDirectMediaUrl(source?.url)) {
      reasons.push('page URL or unsupported media extension (not direct media URL)');
    }

    if (hasExpiringToken(source?.url)) {
      reasons.push('contains token/expiring signed URL parameters');
    }

    if (!source?.subtitleCompatibility || typeof source.subtitleCompatibility !== 'string') {
      reasons.push('subtitleCompatibility is required');
    } else if (!ALLOWED_SUBTITLE_COMPAT.has(source.subtitleCompatibility)) {
      reasons.push('subtitle mismatch or unsupported subtitleCompatibility');
    }

    if (episode && normalizeTitle(source?.title) !== normalizeTitle(episode.title)) {
      reasons.push('wrong episode metadata (title mismatch)');
    }

    let probe = null;
    if (!reasons.length) {
      probe = await probeSource(source.url);

      if (![200, 206].includes(probe.status)) {
        reasons.push('HTTP status is not 200/206');
      }

      if (!probe.rangeSupported) {
        reasons.push('Range requests are not supported');
      }

      if (probe.hasLoginHeaders) {
        reasons.push('response suggests login/cookie-based access');
      }

      if (probe.status === 401 || probe.status === 403) {
        reasons.push('hotlink blocked or unauthorized');
      }

      if (!String(probe.contentType || '').toLowerCase().startsWith('video/')) {
        reasons.push('content type is not video');
      }

      if (Number.isFinite(baselineStartup) && !(probe.startupMs + 120 < baselineStartup)) {
        reasons.push('startup behavior is not better than current Archive source');
      }

      if (probe.startupMs > REQUEST_TIMEOUT_MS || probe.sampleBytes === 0) {
        reasons.push('unstable startup behavior');
      }
    }

    const payload = {
      canonicalId: canonical || null,
      title: source?.title || null,
      url: source?.url || null,
      subtitleCompatibility: source?.subtitleCompatibility || null,
      baselineStartupMs: baselineStartup,
      probe
    };

    if (reasons.length) {
      rejected.push({ ...payload, reasons });
    } else {
      accepted.push(payload);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(INPUT_PATH),
    summary: {
      totalEntries: sources.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length
    },
    accepted,
    rejected
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);

  if (rejected.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
