#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const https = require('https');
const episodes = require('../episodeData');
const arabicSubtitleFiles = require('../arabicSubtitles.json');

const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, '.subtitle-audit-cache');
const AUDIT_DIR = path.join(ROOT, 'audit');
const AR_PRODUCTION_DIR = path.join(ROOT, 'ar');
const REVIEW_DIR = path.join(ROOT, 'review', 'arabic-subtitles');
const ARABIC_BASE_URL = 'https://cdn.jsdelivr.net/gh/mohammadhaddad11/doctor-who-arabic@main/ar/';
const ARCHIVE_METADATA_BASE = 'https://archive.org/metadata/';

const args = new Set(process.argv.slice(2));
const APPLY_FIXES = args.has('--apply-fixes');
const REWRITE_PRODUCTION = args.has('--rewrite-production');
const FORCE_FETCH = args.has('--force-fetch');
const CONCURRENCY = 8;

function log(message) {
  process.stderr.write(`${message}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function fetchBuffer(url, destination, attempt = 1) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!FORCE_FETCH && destination && fs.existsSync(destination)) {
        return resolve(await fsp.readFile(destination));
      }
    } catch (error) {
      return reject(error);
    }

    const request = https.get(url, (response) => {
      const { statusCode, headers } = response;
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        response.resume();
        return resolve(fetchBuffer(headers.location, destination, attempt));
      }

      if (statusCode !== 200) {
        response.resume();
        const err = new Error(`Request failed for ${url}: ${statusCode}`);
        err.statusCode = statusCode;
        return reject(err);
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          if (destination) {
            await ensureDir(path.dirname(destination));
            await fsp.writeFile(destination, buffer);
          }
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('error', async (error) => {
      if (attempt < 3) {
        await sleep(350 * attempt);
        resolve(fetchBuffer(url, destination, attempt + 1));
        return;
      }
      reject(error);
    });
  });
}

function decodeSubtitle(buffer) {
  const decoders = [
    () => new TextDecoder('utf-8', { fatal: true }).decode(buffer),
    () => new TextDecoder('utf-8').decode(buffer),
    () => new TextDecoder('windows-1256').decode(buffer),
    () => new TextDecoder('iso-8859-6').decode(buffer),
    () => buffer.toString('latin1')
  ];

  let best = '';
  let bestScore = -Infinity;

  for (const decode of decoders) {
    try {
      const text = decode();
      const repairedVariants = [text];
      try {
        repairedVariants.push(Buffer.from(text, 'latin1').toString('utf8'));
      } catch {
        // ignore
      }
      for (const variant of repairedVariants) {
        const score = scoreDecodedText(variant);
        if (score > bestScore) {
          best = variant;
          bestScore = score;
        }
      }
    } catch {
      // try next decoder
    }
  }

  return best.replace(/^\uFEFF/, '');
}

function scoreDecodedText(text) {
  const arabicMatches = text.match(/[\u0600-\u06FF]/g) || [];
  const mojibakeArabic = text.match(/[طظ]/g) || [];
  const replacementMatches = text.match(/\uFFFD/g) || [];
  const mojibakeMatches = text.match(/[ÃØÙÞ]/g) || [];
  const cueMarkers = text.match(/-->/g) || [];
  const mojibakeRatio = arabicMatches.length ? mojibakeArabic.length / arabicMatches.length : 0;
  return (
    cueMarkers.length * 20 +
    arabicMatches.length * 2 -
    replacementMatches.length * 10 -
    mojibakeMatches.length * 5 -
    (mojibakeRatio > 0.35 ? mojibakeRatio * 20000 : 0)
  );
}

function toMs(timecode) {
  const match = timecode.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) return null;
  const [, hh, mm, ss, ms] = match;
  return (
    Number(hh) * 3600000 +
    Number(mm) * 60000 +
    Number(ss) * 1000 +
    Number(ms.padEnd(3, '0').slice(0, 3))
  );
}

function formatMs(ms) {
  const clamped = Math.max(0, Math.round(ms));
  const hh = String(Math.floor(clamped / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((clamped % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0');
  const mmm = String(clamped % 1000).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u200f/g, '')
    .trim();
}

function parseSrt(text) {
  const normalized = normalizeText(text);
  const blocks = normalized.split(/\n{2,}/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd());
    if (!lines.length) continue;
    let index = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      index = 1;
    }
    const timeLine = lines[index];
    if (!timeLine || !timeLine.includes('-->')) continue;
    const [startRaw, endRaw] = timeLine.split('-->');
    const start = toMs(startRaw);
    const end = toMs(endRaw);
    if (start == null || end == null || end <= start) continue;
    const cueText = lines.slice(index + 1).join('\n').trim();
    cues.push({
      start,
      end,
      duration: end - start,
      midpoint: (start + end) / 2,
      text: cueText
    });
  }

  return cues;
}

function stringifySrt(cues) {
  return `${cues.map((cue, index) => {
    const text = cue.text || '';
    return [
      index + 1,
      `${formatMs(cue.start)} --> ${formatMs(cue.end)}`,
      text
    ].join('\n');
  }).join('\n\n')}\n`;
}

function episodeId(ep) {
  return `S${String(ep.season).padStart(2, '0')}E${String(ep.episode).padStart(2, '0')}`;
}

function englishFilenameForEpisode(ep) {
  return ep.subtitleUrl ? ep.subtitleUrl.split('/').pop() : null;
}

function arabicFilenameForEpisode(ep) {
  const englishName = englishFilenameForEpisode(ep);
  return englishName ? englishName.replace(/\.srt$/i, '.ar.srt') : null;
}

function isSpecialTitle(title = '') {
  return /special|minisode|prequel|animated/i.test(title);
}

function buildActivity(cues, durationMs, binMs = 1000) {
  const bins = Math.max(1, Math.ceil(durationMs / binMs));
  const activity = new Uint8Array(bins);
  for (const cue of cues) {
    const startBin = Math.max(0, Math.floor(cue.start / binMs));
    const endBin = Math.min(bins - 1, Math.floor(Math.max(cue.start, cue.end - 1) / binMs));
    for (let idx = startBin; idx <= endBin; idx += 1) {
      activity[idx] = 1;
    }
  }
  return activity;
}

function activeIndices(activity) {
  const indices = [];
  for (let i = 0; i < activity.length; i += 1) {
    if (activity[i]) indices.push(i);
  }
  return indices;
}

function sampleQuantiles(sortedValues, count = 60) {
  if (!sortedValues.length) return [];
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const fraction = (i + 1) / (count + 1);
    const rawIndex = fraction * (sortedValues.length - 1);
    const lower = Math.floor(rawIndex);
    const upper = Math.ceil(rawIndex);
    const weight = rawIndex - lower;
    const value = sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    result.push(value);
  }
  return result;
}

function linearFit(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (!n) {
    return { intercept: 0, slope: 1 };
  }
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }
  const slope = denominator === 0 ? 1 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  return { intercept, slope };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rawIndex = fraction * (sorted.length - 1);
  const lower = Math.floor(rawIndex);
  const upper = Math.ceil(rawIndex);
  if (lower === upper) return sorted[lower];
  const weight = rawIndex - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function compareActivities(referenceActivity, candidateActivity, transform = { intercept: 0, slope: 1 }) {
  let intersection = 0;
  let candidateActive = 0;
  let referenceActive = 0;
  for (let i = 0; i < referenceActivity.length; i += 1) {
    if (referenceActivity[i]) referenceActive += 1;
  }

  for (let i = 0; i < candidateActivity.length; i += 1) {
    if (!candidateActivity[i]) continue;
    candidateActive += 1;
    const mapped = Math.round((transform.intercept / 1000) + transform.slope * i);
    if (mapped >= 0 && mapped < referenceActivity.length && referenceActivity[mapped]) {
      intersection += 1;
    }
  }

  const precision = candidateActive ? intersection / candidateActive : 0;
  const recall = referenceActive ? intersection / referenceActive : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const union = candidateActive + referenceActive - intersection;
  const jaccard = union ? intersection / union : 0;
  return { precision, recall, f1, jaccard };
}

function buildProfile(cues, durationMs) {
  const effectiveDuration = Math.max(
    durationMs || 0,
    cues.length ? cues[cues.length - 1].end : 0
  );
  const activity = buildActivity(cues, effectiveDuration);
  return {
    cues,
    durationMs: effectiveDuration,
    activity,
    activeBins: activeIndices(activity),
    cueCount: cues.length,
    speechCoverageMs: cues.reduce((sum, cue) => sum + cue.duration, 0),
    midpointQuantiles: sampleQuantiles(cues.map((cue) => cue.midpoint).sort((a, b) => a - b), 64),
    startQuantiles: sampleQuantiles(cues.map((cue) => cue.start).sort((a, b) => a - b), 64),
    endQuantiles: sampleQuantiles(cues.map((cue) => cue.end).sort((a, b) => a - b), 64)
  };
}

function compareProfiles(reference, candidate) {
  const quantileCount = Math.min(
    reference.midpointQuantiles.length,
    candidate.midpointQuantiles.length
  );
  const candidateQs = candidate.midpointQuantiles.slice(0, quantileCount);
  const referenceQs = reference.midpointQuantiles.slice(0, quantileCount);
  const fitted = linearFit(candidateQs, referenceQs);

  const quantileResiduals = candidateQs.map((value, index) =>
    Math.abs(fitted.intercept + fitted.slope * value - referenceQs[index])
  );
  const earlyOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(quantileCount * 0.1))];
  const middleOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(quantileCount * 0.5))];
  const lateOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(quantileCount * 0.9) - 1)];
  const offsetSpread = lateOffset - earlyOffset;
  const rawActivity = compareActivities(reference.activity, candidate.activity);
  const fittedActivity = compareActivities(reference.activity, candidate.activity, fitted);
  const rawDurationDeltaMs = candidate.durationMs - reference.durationMs;
  const fittedDurationDeltaMs = fitted.intercept + fitted.slope * candidate.durationMs - reference.durationMs;
  const score = fittedActivity.f1 * 100 - median(quantileResiduals) / 90 - Math.abs(offsetSpread) / 3500;

  return {
    score,
    quantileResidualMedianMs: median(quantileResiduals),
    quantileResidualP90Ms: percentile(quantileResiduals, 0.9),
    rawActivity,
    fittedActivity,
    rawDurationDeltaMs,
    fittedDurationDeltaMs,
    fittedInterceptMs: fitted.intercept,
    fittedSlope: fitted.slope,
    earlyOffsetMs: earlyOffset,
    middleOffsetMs: middleOffset,
    lateOffsetMs: lateOffset,
    offsetSpreadMs: offsetSpread
  };
}

function classifyMatch(intendedMatch, bestMatch, secondBestMatch) {
  const intendedStrong = intendedMatch.fittedActivity.f1 >= 0.78 && intendedMatch.quantileResidualMedianMs <= 6000;
  const clearlyBetterAlternative =
    bestMatch.episodeKey !== intendedMatch.episodeKey &&
    bestMatch.score >= intendedMatch.score + 10 &&
    bestMatch.fittedActivity.f1 >= 0.8 &&
    intendedMatch.fittedActivity.f1 <= 0.6;

  if (clearlyBetterAlternative) {
    return { episodeStatus: 'WRONG_EPISODE' };
  }

  const ambiguousAlternative =
    bestMatch.episodeKey !== intendedMatch.episodeKey &&
    bestMatch.score >= intendedMatch.score + 3 &&
    bestMatch.fittedActivity.f1 >= intendedMatch.fittedActivity.f1 + 0.08;

  if (!intendedStrong || ambiguousAlternative || (secondBestMatch && Math.abs(intendedMatch.score - secondBestMatch.score) < 1.5 && secondBestMatch.episodeKey !== intendedMatch.episodeKey)) {
    return { episodeStatus: 'LOW_CONFIDENCE' };
  }

  const raw = intendedMatch.rawActivity;
  const fitted = intendedMatch.fittedActivity;
  const offsetVariation = Math.abs(intendedMatch.offsetSpreadMs);
  const averageOffset = median([
    intendedMatch.earlyOffsetMs,
    intendedMatch.middleOffsetMs,
    intendedMatch.lateOffsetMs
  ]);

  if (
    raw.f1 >= 0.82 &&
    Math.abs(averageOffset) <= 1500 &&
    offsetVariation <= 1800 &&
    Math.abs(intendedMatch.rawDurationDeltaMs) <= 5000
  ) {
    return { episodeStatus: 'CORRECT', syncStatus: 'PASS' };
  }

  if (
    raw.f1 >= 0.72 &&
    Math.abs(averageOffset) <= 3500 &&
    offsetVariation <= 2500 &&
    Math.abs(intendedMatch.rawDurationDeltaMs) <= 9000
  ) {
    return { episodeStatus: 'CORRECT', syncStatus: 'PASS_WITH_MINOR_OFFSET' };
  }

  if (
    fitted.f1 >= 0.85 &&
    offsetVariation <= 2500 &&
    Math.abs(averageOffset) > 3500 &&
    Math.abs(intendedMatch.fittedSlope - 1) <= 0.0035
  ) {
    return { episodeStatus: 'CORRECT', syncStatus: 'FIXABLE_CONSTANT_OFFSET' };
  }

  if (
    fitted.f1 >= 0.82 &&
    offsetVariation > 2500 &&
    offsetVariation <= 25000
  ) {
    return { episodeStatus: 'CORRECT', syncStatus: 'FIXABLE_DRIFT' };
  }

  if (fitted.f1 >= 0.78 && intendedMatch.quantileResidualMedianMs <= 6000) {
    return { episodeStatus: 'CORRECT', syncStatus: 'PASS_WITH_MINOR_OFFSET' };
  }

  return { episodeStatus: 'LOW_CONFIDENCE' };
}

function transformCues(cues, interceptMs, slope) {
  return cues.map((cue) => {
    const start = Math.max(0, interceptMs + slope * cue.start);
    const end = Math.max(start + 100, interceptMs + slope * cue.end);
    return {
      ...cue,
      start,
      end,
      duration: end - start,
      midpoint: (start + end) / 2
    };
  });
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function loadSeasonMetadata() {
  const seasonIds = [...new Set(episodes.map((ep) => `nw_S${String(ep.season).padStart(2, '0')}`))];
  const metadataEntries = await mapLimit(seasonIds, 4, async (seasonId) => {
    const buffer = await fetchBuffer(
      `${ARCHIVE_METADATA_BASE}${seasonId}`,
      path.join(CACHE_DIR, 'metadata', `${seasonId}.json`)
    );
    const parsed = JSON.parse(buffer.toString('utf8'));
    return [seasonId, parsed];
  });

  const durations = new Map();
  for (const [, metadata] of metadataEntries) {
    for (const file of metadata.files || []) {
      if (file.name && /\.mp4$/i.test(file.name) && file.source === 'original' && file.length) {
        durations.set(file.name, Number(file.length) * 1000);
      }
    }
  }
  return durations;
}

async function loadEnglishProfiles(videoDurationByFile) {
  const englishEpisodes = episodes.filter((episode) => episode.subtitleUrl);
  const loaded = await mapLimit(englishEpisodes, CONCURRENCY, async (episode) => {
    const englishName = englishFilenameForEpisode(episode);
    const buffer = await fetchBuffer(
      episode.subtitleUrl,
      path.join(CACHE_DIR, 'english', englishName)
    );
    const text = decodeSubtitle(buffer);
    const cues = parseSrt(text);
    const profile = buildProfile(cues, videoDurationByFile.get(episode.streamUrl.split('/').pop()));
    return {
      episode,
      episodeKey: episodeId(episode),
      englishName,
      profile,
      text
    };
  });

  return loaded;
}

async function auditArabicProfiles(englishProfiles, videoDurationByFile) {
  const expectedArabicEpisodes = episodes
    .filter((episode) => arabicSubtitleFiles.includes(arabicFilenameForEpisode(episode)))
    .map((episode) => ({
      episode,
      episodeKey: episodeId(episode),
      englishName: englishFilenameForEpisode(episode),
      arabicName: arabicFilenameForEpisode(episode)
    }));

  const englishByKey = new Map(englishProfiles.map((entry) => [entry.episodeKey, entry]));
  const findings = await mapLimit(expectedArabicEpisodes, CONCURRENCY, async ({ episode, episodeKey, englishName, arabicName }, index) => {
    log(`Auditing ${index + 1}/${expectedArabicEpisodes.length}: ${episodeKey} ${episode.title}`);
    const localArabicPath = path.join(AR_PRODUCTION_DIR, arabicName);
    const arabicBuffer = fs.existsSync(localArabicPath)
      ? await fsp.readFile(localArabicPath)
      : await fetchBuffer(
        `${ARABIC_BASE_URL}${encodeURIComponent(arabicName)}`,
        path.join(CACHE_DIR, 'arabic', arabicName)
      );
    const arabicText = decodeSubtitle(arabicBuffer);
    const arabicCues = parseSrt(arabicText);
    const arabicProfile = buildProfile(arabicCues, videoDurationByFile.get(episode.streamUrl.split('/').pop()));
    const intendedEnglish = englishByKey.get(episodeKey);
    const matches = englishProfiles.map((candidate) => ({
      episodeKey: candidate.episodeKey,
      title: candidate.episode.title,
      season: candidate.episode.season,
      episodeNumber: candidate.episode.episode,
      englishName: candidate.englishName,
      ...compareProfiles(candidate.profile, arabicProfile)
    })).sort((a, b) => b.score - a.score);

    const intendedMatch = matches.find((match) => match.episodeKey === episodeKey);
    const bestMatch = matches[0];
    const secondBestMatch = matches[1];
    const classification = classifyMatch(intendedMatch, bestMatch, secondBestMatch);
    const durationMs = videoDurationByFile.get(episode.streamUrl.split('/').pop()) || 0;

    return {
      canonicalId: episodeKey,
      season: episode.season,
      episode: episode.episode,
      title: episode.title,
      isSpecial: isSpecialTitle(episode.title),
      streamUrl: episode.streamUrl,
      englishSubtitle: episode.subtitleUrl,
      arabicSubtitle: `ar/${arabicName}`,
      arabicExpected: true,
      englishFilename: englishName,
      arabicFilename: arabicName,
      videoDurationMs: durationMs,
      arabicCueCount: arabicCues.length,
      englishCueCount: intendedEnglish ? intendedEnglish.profile.cueCount : 0,
      episodeStatus: classification.episodeStatus,
      syncStatus: classification.syncStatus || null,
      intendedMatch,
      bestMatch,
      secondBestMatch,
      topMatches: matches.slice(0, 5),
      sampleArabicText: arabicCues.slice(0, 3).map((cue) => cue.text),
      shouldFix:
        classification.syncStatus === 'FIXABLE_CONSTANT_OFFSET' ||
        classification.syncStatus === 'FIXABLE_DRIFT',
      replacementCandidate:
        classification.episodeStatus === 'WRONG_EPISODE' ? bestMatch : null
    };
  });

  return findings;
}

async function buildAuditTable() {
  const availableArabicFiles = new Set(arabicSubtitleFiles);
  return episodes.map((episode) => {
    const englishName = englishFilenameForEpisode(episode);
    const arabicName = arabicFilenameForEpisode(episode);
    return {
      canonicalId: episodeId(episode),
      season: episode.season,
      episode: episode.episode,
      title: episode.title,
      isSpecial: isSpecialTitle(episode.title),
      streamUrl: episode.streamUrl || null,
      englishSubtitle: episode.subtitleUrl || null,
      arabicSubtitle: arabicName ? `ar/${arabicName}` : null,
      arabicExpected: arabicName ? availableArabicFiles.has(arabicName) : false
    };
  });
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  return `${headers.join(',')}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(',')).join('\n')}\n`;
}

async function rewriteProductionSet(findings) {
  await ensureDir(AR_PRODUCTION_DIR);
  await ensureDir(REVIEW_DIR);

  const productionFiles = [];
  const reviewEntries = [];

  for (const finding of findings) {
    const sourcePath = path.join(CACHE_DIR, 'arabic', finding.arabicFilename);
    const reviewTarget = path.join(REVIEW_DIR, finding.arabicFilename);
    const productionTarget = path.join(AR_PRODUCTION_DIR, finding.arabicFilename);
    const originalBuffer = await fsp.readFile(sourcePath);
    let finalBuffer = originalBuffer;
    let changed = false;

    if (finding.syncStatus === 'FIXABLE_CONSTANT_OFFSET' || finding.syncStatus === 'FIXABLE_DRIFT') {
      const originalText = decodeSubtitle(originalBuffer);
      const cues = parseSrt(originalText);
      const fixedCues = transformCues(
        cues,
        finding.intendedMatch.fittedInterceptMs,
        finding.intendedMatch.fittedSlope
      );
      finalBuffer = Buffer.from(stringifySrt(fixedCues), 'utf8');
      changed = true;
    }

    if (finding.episodeStatus === 'CORRECT') {
      await fsp.writeFile(productionTarget, finalBuffer);
      productionFiles.push(finding.arabicFilename);
    } else {
      await fsp.writeFile(reviewTarget, finalBuffer);
      reviewEntries.push({
        canonicalId: finding.canonicalId,
        title: finding.title,
        arabicFilename: finding.arabicFilename,
        episodeStatus: finding.episodeStatus,
        syncStatus: finding.syncStatus,
        bestMatch: finding.bestMatch ? finding.bestMatch.episodeKey : null,
        changed
      });
    }
  }

  const reviewReportPath = path.join(AUDIT_DIR, 'arabic-subtitles-manual-review.json');
  await ensureDir(AUDIT_DIR);
  await fsp.writeFile(reviewReportPath, JSON.stringify(reviewEntries, null, 2));
  return productionFiles.sort();
}

async function main() {
  await ensureDir(CACHE_DIR);
  await ensureDir(AUDIT_DIR);

  const videoDurationByFile = await loadSeasonMetadata();
  const englishProfiles = await loadEnglishProfiles(videoDurationByFile);
  const auditTable = await buildAuditTable();
  const findings = await auditArabicProfiles(englishProfiles, videoDurationByFile);

  const summary = {
    totalEpisodes: episodes.length,
    totalArabicExpected: findings.length,
    passed: findings.filter((item) => item.syncStatus === 'PASS').length,
    passWithMinorOffset: findings.filter((item) => item.syncStatus === 'PASS_WITH_MINOR_OFFSET').length,
    fixableConstantOffset: findings.filter((item) => item.syncStatus === 'FIXABLE_CONSTANT_OFFSET').length,
    fixableDrift: findings.filter((item) => item.syncStatus === 'FIXABLE_DRIFT').length,
    wrongEpisode: findings.filter((item) => item.episodeStatus === 'WRONG_EPISODE').length,
    lowConfidence: findings.filter((item) => item.episodeStatus === 'LOW_CONFIDENCE').length
  };

  const report = {
    generatedAt: new Date().toISOString(),
    summary,
    auditTable,
    findings
  };

  await fsp.writeFile(path.join(AUDIT_DIR, 'subtitle-audit.json'), JSON.stringify(report, null, 2));
  await fsp.writeFile(
    path.join(AUDIT_DIR, 'subtitle-audit.csv'),
    toCsv(auditTable)
  );
  await fsp.writeFile(
    path.join(AUDIT_DIR, 'subtitle-findings.csv'),
    toCsv(findings.map((finding) => ({
      canonicalId: finding.canonicalId,
      title: finding.title,
      season: finding.season,
      episode: finding.episode,
      episodeStatus: finding.episodeStatus,
      syncStatus: finding.syncStatus,
      intendedScore: finding.intendedMatch.score.toFixed(2),
      intendedRawF1: finding.intendedMatch.rawActivity.f1.toFixed(4),
      intendedFittedF1: finding.intendedMatch.fittedActivity.f1.toFixed(4),
      intendedMedianResidualMs: Math.round(finding.intendedMatch.quantileResidualMedianMs),
      fittedInterceptMs: Math.round(finding.intendedMatch.fittedInterceptMs),
      fittedSlope: finding.intendedMatch.fittedSlope.toFixed(6),
      offsetSpreadMs: Math.round(finding.intendedMatch.offsetSpreadMs),
      bestAlternative: finding.bestMatch.episodeKey,
      bestAlternativeTitle: finding.bestMatch.title,
      bestAlternativeScore: finding.bestMatch.score.toFixed(2)
    })))
  );

  let productionFiles = null;
  if (REWRITE_PRODUCTION) {
    productionFiles = await rewriteProductionSet(findings);
    if (APPLY_FIXES) {
      await fsp.writeFile(
        path.join(ROOT, 'arabicSubtitles.json'),
        `${JSON.stringify(productionFiles, null, 2)}\n`
      );
    }
  }

  const result = {
    summary,
    reportPath: path.join(AUDIT_DIR, 'subtitle-audit.json'),
    findingsPath: path.join(AUDIT_DIR, 'subtitle-findings.csv'),
    productionFilesWritten: productionFiles ? productionFiles.length : 0
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
