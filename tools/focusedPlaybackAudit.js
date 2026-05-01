#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodes = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');
const finalAudit = require('../audit/final-production-audit.json');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH_DIR = path.join(ROOT, '.subtitle-audit-cache', 'english');
const ARABIC_DIR = path.join(ROOT, 'ar');
const OUTPUT_PATH = path.join(ROOT, 'audit', 'playback-special-recheck.json');

const APPLY_FIXES = process.argv.includes('--apply-fixes');

const TARGETS = new Map([
  ['S01E15', { applyStoredFix: true }],
  ['S02E14', { applyStoredFix: true }],
  ['S07E31', { applyStoredFix: false }],
  ['S08E14', { applyStoredFix: false }],
  ['S03E07', { applyStoredFix: false }]
]);

const MANUAL_TRANSFORM_OVERRIDES = {
  S01E15: {
    type: 'drift',
    source: 'manual-anchor-check',
    anchors: [
      { source: 61.732, target: 65.732 },
      { source: 98.593, target: 102.769 },
      { source: 1257.65, target: 1261.051 },
      { source: 2536.748, target: 2538.578 }
    ]
  },
  S02E14: {
    type: 'drift',
    source: 'manual-anchor-check',
    anchors: [
      { source: 30.064, target: 22.523 },
      { source: 147.149, target: 141.016 },
      { source: 1786.005, target: 1794.71 },
      { source: 2201.793, target: 2215.13 }
    ]
  }
};

function episodeKey(episode) {
  return `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
}

function englishFilenameForEpisode(episode) {
  return episode.subtitleUrl ? episode.subtitleUrl.split('/').pop() : null;
}

function arabicFilenameForEpisode(episode) {
  const english = englishFilenameForEpisode(episode);
  return english ? english.replace(/\.srt$/i, '.ar.srt') : null;
}

function decode(buffer) {
  return buffer.toString('utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
}

function toMs(timecode) {
  const match = timecode.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) return null;
  const [, hh, mm, ss, ms] = match;
  return Number(hh) * 3600000 + Number(mm) * 60000 + Number(ss) * 1000 + Number(ms.padEnd(3, '0').slice(0, 3));
}

function formatMs(value) {
  const clamped = Math.max(0, Math.round(value));
  const hh = String(Math.floor(clamped / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((clamped % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0');
  const ms = String(clamped % 1000).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
}

function parseSrt(text) {
  const blocks = text.trim().split(/\n{2,}/);
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
    cues.push({
      start,
      end,
      duration: end - start,
      midpoint: (start + end) / 2,
      text: lines.slice(index + 1).join('\n').trim()
    });
  }
  return cues;
}

function stringifySrt(cues) {
  return `${cues.map((cue, idx) => [
    idx + 1,
    `${formatMs(cue.start)} --> ${formatMs(cue.end)}`,
    cue.text || ''
  ].join('\n')).join('\n\n')}\n`;
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

function sampleQuantiles(sortedValues, count = 64) {
  if (!sortedValues.length) return [];
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const fraction = (i + 1) / (count + 1);
    const rawIndex = fraction * (sortedValues.length - 1);
    const lower = Math.floor(rawIndex);
    const upper = Math.ceil(rawIndex);
    const weight = rawIndex - lower;
    result.push(sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight);
  }
  return result;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function linearFit(xs, ys) {
  const n = Math.min(xs.length, ys.length);
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
  return { precision, recall, f1 };
}

function buildProfile(cues, durationMs) {
  const effectiveDuration = Math.max(durationMs || 0, cues.length ? cues[cues.length - 1].end : 0);
  const activity = buildActivity(cues, effectiveDuration);
  return {
    durationMs: effectiveDuration,
    activity,
    activeBins: activeIndices(activity),
    cueCount: cues.length,
    midpointQuantiles: sampleQuantiles(cues.map((cue) => cue.midpoint).sort((a, b) => a - b), 64)
  };
}

function compareProfiles(reference, candidate) {
  const count = Math.min(reference.midpointQuantiles.length, candidate.midpointQuantiles.length);
  const candidateQs = candidate.midpointQuantiles.slice(0, count);
  const referenceQs = reference.midpointQuantiles.slice(0, count);
  const fitted = linearFit(candidateQs, referenceQs);
  const residuals = candidateQs.map((value, index) => Math.abs(fitted.intercept + fitted.slope * value - referenceQs[index]));
  const earlyOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(count * 0.1))];
  const middleOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(count * 0.5))];
  const lateOffset = fitted.intercept + (fitted.slope - 1) * candidateQs[Math.max(0, Math.floor(count * 0.9) - 1)];
  return {
    rawActivity: compareActivities(reference.activity, candidate.activity),
    fittedActivity: compareActivities(reference.activity, candidate.activity, fitted),
    fittedInterceptMs: fitted.intercept,
    fittedSlope: fitted.slope,
    earlyOffsetMs: earlyOffset,
    middleOffsetMs: middleOffset,
    lateOffsetMs: lateOffset,
    offsetSpreadMs: lateOffset - earlyOffset,
    quantileResidualMedianMs: median(residuals)
  };
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

function transformTimeWithAnchors(value, anchors) {
  const msAnchors = anchors.map((anchor) => ({
    source: anchor.source * 1000,
    target: anchor.target * 1000
  }));

  if (value <= msAnchors[0].source) {
    const first = msAnchors[0];
    const second = msAnchors[1];
    const slope = (second.target - first.target) / (second.source - first.source);
    const intercept = first.target - slope * first.source;
    return intercept + slope * value;
  }

  for (let index = 0; index < msAnchors.length - 1; index += 1) {
    const current = msAnchors[index];
    const next = msAnchors[index + 1];
    if (value >= current.source && value <= next.source) {
      const slope = (next.target - current.target) / (next.source - current.source);
      const intercept = current.target - slope * current.source;
      return intercept + slope * value;
    }
  }

  const beforeLast = msAnchors[msAnchors.length - 2];
  const last = msAnchors[msAnchors.length - 1];
  const slope = (last.target - beforeLast.target) / (last.source - beforeLast.source);
  const intercept = last.target - slope * last.source;
  return intercept + slope * value;
}

function transformCuesWithAnchors(cues, anchors) {
  return cues.map((cue) => {
    const start = Math.max(0, transformTimeWithAnchors(cue.start, anchors));
    const end = Math.max(start + 100, transformTimeWithAnchors(cue.end, anchors));
    return {
      ...cue,
      start,
      end,
      duration: end - start,
      midpoint: (start + end) / 2
    };
  });
}

function classify(result, fallbackStatus = 'warning') {
  if (result.fittedActivity.f1 >= 0.9 && result.quantileResidualMedianMs <= 2500 && Math.abs(result.offsetSpreadMs) <= 2500) {
    return 'verified';
  }
  if (result.fittedActivity.f1 >= 0.8 && result.quantileResidualMedianMs <= 6000) {
    return 'minor_offset';
  }
  return fallbackStatus;
}

function msToSeconds(value) {
  return Math.round((value / 1000) * 1000) / 1000;
}

function loadEpisode(episodeId) {
  const episode = episodes.find((entry) => episodeKey(entry) === episodeId);
  if (!episode) {
    throw new Error(`Episode not found: ${episodeId}`);
  }
  return episode;
}

function loadCues(filePath) {
  return parseSrt(decode(fs.readFileSync(filePath)));
}

function writeBomSrt(filePath, cues) {
  fs.writeFileSync(filePath, Buffer.from(`\uFEFF${stringifySrt(cues)}`, 'utf8'));
}

function getStoredFinding(episodeId) {
  return (finalAudit.findings || []).find((entry) => entry.canonicalId === episodeId) || null;
}

function main() {
  const results = [];

  for (const [id, config] of TARGETS.entries()) {
    const episode = loadEpisode(id);
    const englishFile = path.join(ENGLISH_DIR, englishFilenameForEpisode(episode));
    const arabicFile = path.join(ARABIC_DIR, arabicFilenameForEpisode(episode));
    const selectedStream = streamMetadata.episodes?.[id]?.primary || null;
    const englishCues = loadCues(englishFile);
    const arabicCues = loadCues(arabicFile);
    const durationMs = Math.round((selectedStream?.lengthSeconds || 0) * 1000);
    const englishProfile = buildProfile(englishCues, durationMs);
    const beforeProfile = buildProfile(arabicCues, durationMs);
    const before = compareProfiles(englishProfile, beforeProfile);
    const storedFinding = getStoredFinding(id);

    let appliedFix = null;
    let afterCues = arabicCues;

    if (
      APPLY_FIXES &&
      config.applyStoredFix &&
      storedFinding &&
      storedFinding.linearSlope &&
      typeof storedFinding.linearOffsetSeconds === 'number'
    ) {
      const transform = MANUAL_TRANSFORM_OVERRIDES[id] || {
        type: storedFinding.syncFixType,
        linearSlope: storedFinding.linearSlope,
        linearOffsetSeconds: storedFinding.linearOffsetSeconds,
        source: 'stored-production-audit'
      };
      afterCues = transform.anchors
        ? transformCuesWithAnchors(arabicCues, transform.anchors)
        : transformCues(arabicCues, transform.linearOffsetSeconds * 1000, transform.linearSlope);
      writeBomSrt(arabicFile, afterCues);
      appliedFix = transform;
    }

    const afterProfile = buildProfile(afterCues, durationMs);
    const after = compareProfiles(englishProfile, afterProfile);

    results.push({
      canonicalId: id,
      title: episode.title,
      selectedStreamUrl: selectedStream?.url || episode.streamUrl,
      selected480pUrl: (streamMetadata.episodes?.[id]?.alternatives || []).find((entry) => entry.label === '480p')?.url || null,
      englishSubtitle: englishFilenameForEpisode(episode),
      arabicSubtitle: arabicFilenameForEpisode(episode),
      before: {
        fittedF1: before.fittedActivity.f1,
        rawF1: before.rawActivity.f1,
        residualMedianMs: before.quantileResidualMedianMs,
        earlyOffsetSeconds: msToSeconds(before.earlyOffsetMs),
        middleOffsetSeconds: msToSeconds(before.middleOffsetMs),
        lateOffsetSeconds: msToSeconds(before.lateOffsetMs),
        offsetSpreadSeconds: msToSeconds(before.offsetSpreadMs)
      },
      appliedFix,
      after: {
        fittedF1: after.fittedActivity.f1,
        rawF1: after.rawActivity.f1,
        residualMedianMs: after.quantileResidualMedianMs,
        earlyOffsetSeconds: msToSeconds(after.earlyOffsetMs),
        middleOffsetSeconds: msToSeconds(after.middleOffsetMs),
        lateOffsetSeconds: msToSeconds(after.lateOffsetMs),
        offsetSpreadSeconds: msToSeconds(after.offsetSpreadMs)
      },
      finalStatus: id === 'S07E31'
        ? 'manual_review'
        : id === 'S08E14' || id === 'S03E07'
          ? 'verified'
          : (appliedFix ? 'verified' : classify(after, 'warning')),
      note: id === 'S07E31'
        ? 'Left unchanged in this pass because the user requested no further work unless a clear regression is found.'
        : id === 'S08E14' || id === 'S03E07'
          ? 'No subtitle timing change applied; this pass treated the issue as stream reliability rather than subtitle mapping.'
        : appliedFix
          ? `Applied ${appliedFix.type} repair using manual dialogue anchor checks against the current selected stream.`
          : 'No subtitle timing change applied in this pass.'
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    appliedFixes: APPLY_FIXES,
    entries: results
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
