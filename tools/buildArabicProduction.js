#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const report = require('../audit/subtitle-audit.json');

const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, '.subtitle-audit-cache');
const AR_DIR = path.join(ROOT, 'ar');
const REVIEW_DIR = path.join(ROOT, 'review', 'arabic-subtitles');
const AUDIT_DIR = path.join(ROOT, 'audit');

const SNOWMEN_REPLACEMENT_PATH = '/tmp/the_snowmen_1/Doctor who Snowmen .srt';

const MANUAL_REPLACEMENTS = {
  'E14_the_snowmen_special.ar.srt': {
    type: 'external',
    path: SNOWMEN_REPLACEMENT_PATH,
    reason: 'Downloaded replacement candidate matched The Snowmen with strong timing alignment.'
  },
  'E16_the_bells_of_saint_john.ar.srt': {
    type: 'cache',
    file: 'E14_the_snowmen_special.ar.srt',
    reason: 'Original Snowmen file actually belongs to The Bells of Saint John.'
  },
  'E17_the_rings_of_akhaten.ar.srt': {
    type: 'cache',
    file: 'E16_the_bells_of_saint_john.ar.srt',
    reason: 'Original Bells of Saint John file actually belongs to The Rings of Akhaten.'
  },
  'E19_cold_war.ar.srt': {
    type: 'cache',
    file: 'E17_the_rings_of_akhaten.ar.srt',
    reason: 'Original Rings of Akhaten file actually belongs to Cold War.'
  },
  'E20_hide.ar.srt': {
    type: 'cache',
    file: 'E19_cold_war.ar.srt',
    reason: 'Original Cold War file actually belongs to Hide.'
  },
  'E21_journey_to_the_centre_of_the_tardis.ar.srt': {
    type: 'cache',
    file: 'E20_hide.ar.srt',
    reason: 'Original Hide file actually belongs to Journey to the Centre of the TARDIS.'
  },
  'E23_the_crimson_horror.ar.srt': {
    type: 'cache',
    file: 'E21_journey_to_the_centre_of_the_tardis.ar.srt',
    reason: 'Original Journey to the Centre of the TARDIS file actually belongs to The Crimson Horror.'
  },
  'E24_nightmare_in_silver.ar.srt': {
    type: 'cache',
    file: 'E23_the_crimson_horror.ar.srt',
    reason: 'Original The Crimson Horror file actually belongs to Nightmare in Silver.'
  }
};

const REVIEW_ORIGINALS = new Set([
  'E14_the_snowmen_special.ar.srt',
  'E16_the_bells_of_saint_john.ar.srt',
  'E17_the_rings_of_akhaten.ar.srt',
  'E19_cold_war.ar.srt',
  'E20_hide.ar.srt',
  'E21_journey_to_the_centre_of_the_tardis.ar.srt',
  'E23_the_crimson_horror.ar.srt',
  'E24_nightmare_in_silver.ar.srt'
]);

function ensureDir(dirPath) {
  return fsp.mkdir(dirPath, { recursive: true });
}

function decodeSubtitle(buffer) {
  const seedDecoders = [
    () => new TextDecoder('utf-8', { fatal: true }).decode(buffer),
    () => new TextDecoder('utf-8').decode(buffer),
    () => new TextDecoder('windows-1256').decode(buffer),
    () => new TextDecoder('iso-8859-6').decode(buffer),
    () => buffer.toString('latin1')
  ];

  const variants = [];
  for (const decode of seedDecoders) {
    try {
      const text = decode();
      variants.push(text);
      try {
        variants.push(Buffer.from(text, 'latin1').toString('utf8'));
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }

  let best = '';
  let bestScore = -Infinity;
  for (const variant of variants) {
    const arabicChars = variant.match(/[\u0600-\u06FF]/g) || [];
    const mojibakeChars = variant.match(/[طظ]/g) || [];
    const mojibakeRatio = arabicChars.length ? mojibakeChars.length / arabicChars.length : 0;
    const score =
      (variant.match(/-->/g) || []).length * 20 +
      arabicChars.length * 2 -
      (variant.match(/\uFFFD/g) || []).length * 10 -
      (variant.match(/[ÃØÙ]/g) || []).length * 5 -
      (mojibakeRatio > 0.35 ? mojibakeRatio * 20000 : 0);
    if (score > bestScore) {
      best = variant;
      bestScore = score;
    }
  }

  return best.replace(/^\uFEFF/, '');
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

function parseSrt(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\u200f/g, '');
  const blocks = normalized.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd());
    if (!lines.length) continue;
    const offset = /^\d+$/.test(lines[0].trim()) ? 1 : 0;
    if (!lines[offset] || !lines[offset].includes('-->')) continue;
    const [startRaw, endRaw] = lines[offset].split('-->');
    const start = toMs(startRaw);
    const end = toMs(endRaw);
    if (start == null || end == null || end <= start) continue;
    cues.push({
      start,
      end,
      text: lines.slice(offset + 1).join('\n').trim()
    });
  }
  return cues;
}

function stringifySrt(cues) {
  return `${cues.map((cue, index) => [
    index + 1,
    `${formatMs(cue.start)} --> ${formatMs(cue.end)}`,
    cue.text || ''
  ].join('\n')).join('\n\n')}\n`;
}

function activity(cues, durationMs) {
  const bins = Math.max(1, Math.ceil(durationMs / 1000));
  const arr = new Uint8Array(bins);
  for (const cue of cues) {
    const startBin = Math.max(0, Math.floor(cue.start / 1000));
    const endBin = Math.min(bins - 1, Math.floor(Math.max(cue.start, cue.end - 1) / 1000));
    for (let idx = startBin; idx <= endBin; idx += 1) {
      arr[idx] = 1;
    }
  }
  return arr;
}

function compareActivity(reference, candidate, shiftBins = 0, start = 0, end = reference.length) {
  let intersection = 0;
  let candidateActive = 0;
  let referenceActive = 0;
  for (let i = start; i < Math.min(end, reference.length); i += 1) {
    if (reference[i]) referenceActive += 1;
  }
  for (let i = 0; i < candidate.length; i += 1) {
    if (!candidate[i]) continue;
    const mapped = i + shiftBins;
    if (mapped < start || mapped >= end || mapped < 0 || mapped >= reference.length) continue;
    candidateActive += 1;
    if (reference[mapped]) intersection += 1;
  }
  const precision = candidateActive ? intersection / candidateActive : 0;
  const recall = referenceActive ? intersection / referenceActive : 0;
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}

function bestShift(reference, candidate, maxShiftBins = 300, start = 0, end = reference.length) {
  let best = { shift: 0, f1: compareActivity(reference, candidate, 0, start, end) };
  for (let shift = -maxShiftBins; shift <= maxShiftBins; shift += 1) {
    const f1 = compareActivity(reference, candidate, shift, start, end);
    if (f1 > best.f1) {
      best = { shift, f1 };
    }
  }
  return best;
}

function fitLine(points) {
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  let numerator = 0;
  let denominator = 0;
  for (const point of points) {
    numerator += (point.x - meanX) * (point.y - meanY);
    denominator += (point.x - meanX) ** 2;
  }
  const m = denominator ? numerator / denominator : 0;
  const b = meanY - m * meanX;
  return { m, b };
}

function transformCues(cues, fit) {
  return cues.map((cue) => {
    const startSeconds = cue.start / 1000;
    const endSeconds = cue.end / 1000;
    const mappedStart = fit.b + (1 + fit.m) * startSeconds;
    const mappedEnd = fit.b + (1 + fit.m) * endSeconds;
    const start = Math.max(0, mappedStart * 1000);
    const end = Math.max(start + 100, mappedEnd * 1000);
    return {
      ...cue,
      start,
      end
    };
  });
}

function analyzeSync(cues, englishCues, videoDurationMs) {
  const englishDuration = Math.max(videoDurationMs, englishCues.length ? englishCues.at(-1).end : 0);
  const arabicDuration = Math.max(videoDurationMs, cues.length ? cues.at(-1).end : 0);
  const durationMs = Math.max(englishDuration, arabicDuration);
  const englishActivity = activity(englishCues, durationMs);
  const arabicActivity = activity(cues, durationMs);
  const rawF1 = compareActivity(englishActivity, arabicActivity, 0);
  const globalShift = bestShift(englishActivity, arabicActivity);
  const length = englishActivity.length;
  const early = bestShift(englishActivity, arabicActivity, 300, 0, Math.floor(length * 0.3));
  const middle = bestShift(englishActivity, arabicActivity, 300, Math.floor(length * 0.35), Math.floor(length * 0.65));
  const late = bestShift(englishActivity, arabicActivity, 300, Math.floor(length * 0.7), length);
  const fit = fitLine([
    { x: length * 0.15, y: early.shift },
    { x: length * 0.5, y: middle.shift },
    { x: length * 0.85, y: late.shift }
  ]);
  const transformed = transformCues(cues, fit);
  const transformedActivity = activity(transformed, durationMs);
  const linearF1 = compareActivity(englishActivity, transformedActivity, 0);
  const shifts = [early.shift, middle.shift, late.shift];
  const spread = Math.max(...shifts) - Math.min(...shifts);

  let fixType = null;
  let fixedCues = cues;
  if (spread === 0 && Math.abs(globalShift.shift) >= 2 && globalShift.f1 - rawF1 >= 0.08) {
    fixType = 'constant_offset';
    fixedCues = cues.map((cue) => ({
      ...cue,
      start: Math.max(0, cue.start + globalShift.shift * 1000),
      end: Math.max(100, cue.end + globalShift.shift * 1000)
    }));
  } else if (linearF1 - rawF1 >= 0.08 && linearF1 >= 0.8) {
    fixType = 'drift';
    fixedCues = transformed;
  }

  const fixedActivity = activity(fixedCues, durationMs);
  const fixedF1 = compareActivity(englishActivity, fixedActivity, 0);
  const lastCueMs = fixedCues.length ? fixedCues.at(-1).end : 0;
  const coverageGapMs = videoDurationMs - lastCueMs;

  let finalStatus = 'PASS';
  if (fixType === 'constant_offset') {
    finalStatus = 'FIXED_CONSTANT_OFFSET';
  } else if (fixType === 'drift') {
    finalStatus = 'FIXED_DRIFT';
  } else if (fixedF1 >= 0.82 && (Math.abs(globalShift.shift) >= 2 || spread >= 2)) {
    finalStatus = 'PASS_WITH_MINOR_OFFSET';
  } else if (fixedF1 < 0.82) {
    finalStatus = 'MANUAL_REVIEW';
  }

  return {
    rawF1,
    globalShift,
    earlyShift: early,
    middleShift: middle,
    lateShift: late,
    linearF1,
    fixedF1,
    fit,
    spread,
    fixType,
    finalStatus,
    fixedCues,
    coverageGapMs
  };
}

async function removeDirContents(dirPath) {
  await ensureDir(dirPath);
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);
    await fsp.rm(fullPath, { recursive: true, force: true });
  }));
}

async function loadSourceText(filename) {
  const replacement = MANUAL_REPLACEMENTS[filename];
  if (replacement?.type === 'external') {
    if (!fs.existsSync(replacement.path)) {
      throw new Error(`Missing external replacement source: ${replacement.path}`);
    }
    return decodeSubtitle(await fsp.readFile(replacement.path));
  }

  if (replacement?.type === 'cache') {
    return decodeSubtitle(await fsp.readFile(path.join(CACHE_DIR, 'arabic', replacement.file)));
  }

  return decodeSubtitle(await fsp.readFile(path.join(CACHE_DIR, 'arabic', filename)));
}

function sanitizeCues(filename, cues) {
  if (filename === 'E14_the_snowmen_special.ar.srt' && cues.length) {
    const firstText = cues[0].text || '';
    if (/جيتالو|🦊/.test(firstText)) {
      return cues.slice(1);
    }
  }
  return cues;
}

async function main() {
  await removeDirContents(AR_DIR);
  await removeDirContents(REVIEW_DIR);
  await ensureDir(AUDIT_DIR);

  const productionFiles = [];
  const reviewManifest = [];
  const finalFindings = [];

  for (const finding of report.findings) {
    const filename = finding.arabicFilename;
    const originalBuffer = await fsp.readFile(path.join(CACHE_DIR, 'arabic', filename));
    const originalText = decodeSubtitle(originalBuffer);

    if (REVIEW_ORIGINALS.has(filename)) {
      const reviewPath = path.join(REVIEW_DIR, filename.replace(/\.srt$/i, '.original-source.srt'));
      await fsp.writeFile(reviewPath, Buffer.from(originalText, 'utf8'));
      reviewManifest.push({
        filename,
        path: reviewPath,
        reason: MANUAL_REPLACEMENTS[filename]?.reason || 'Original remote production file was removed from production during audit.'
      });
    }

    const sourceText = await loadSourceText(filename);
    const sourceCues = sanitizeCues(filename, parseSrt(sourceText));
    const englishText = await fsp.readFile(path.join(CACHE_DIR, 'english', finding.englishFilename), 'utf8');
    const englishCues = parseSrt(englishText);
    const sync = analyzeSync(sourceCues, englishCues, finding.videoDurationMs);

    const outputCues = sync.fixedCues;
    const outputText = stringifySrt(outputCues);

    if (sync.finalStatus === 'MANUAL_REVIEW') {
      const reviewPath = path.join(REVIEW_DIR, filename.replace(/\.srt$/i, '.manual-review.srt'));
      await fsp.writeFile(reviewPath, Buffer.from(outputText, 'utf8'));
      reviewManifest.push({
        filename,
        path: reviewPath,
        reason: 'Post-fix audit still left this subtitle below the production confidence bar.'
      });
    } else {
      const outputPath = path.join(AR_DIR, filename);
      await fsp.writeFile(outputPath, Buffer.from(outputText, 'utf8'));
      productionFiles.push(filename);
    }

    finalFindings.push({
      canonicalId: finding.canonicalId,
      title: finding.title,
      filename,
      manualReplacement: Boolean(MANUAL_REPLACEMENTS[filename]),
      replacementReason: MANUAL_REPLACEMENTS[filename]?.reason || null,
      syncFixType: sync.fixType,
      finalStatus: sync.finalStatus,
      rawF1: Number(sync.rawF1.toFixed(3)),
      fixedF1: Number(sync.fixedF1.toFixed(3)),
      globalShiftSeconds: Number(sync.globalShift.shift.toFixed(0)),
      windowShiftSeconds: [sync.earlyShift.shift, sync.middleShift.shift, sync.lateShift.shift],
      linearSlope: Number((1 + sync.fit.m).toFixed(6)),
      linearOffsetSeconds: Number(sync.fit.b.toFixed(3)),
      coverageGapSeconds: Number((sync.coverageGapMs / 1000).toFixed(1))
    });
  }

  const sortedProductionFiles = productionFiles.sort();
  await fsp.writeFile(
    path.join(ROOT, 'arabicSubtitles.json'),
    `${JSON.stringify(sortedProductionFiles, null, 2)}\n`
  );
  await fsp.writeFile(
    path.join(AUDIT_DIR, 'final-production-audit.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      reviewManifest,
      findings: finalFindings
    }, null, 2)
  );

  process.stdout.write(`${JSON.stringify({
    writtenFiles: sortedProductionFiles.length,
    reviewFiles: reviewManifest.length,
    auditPath: path.join(AUDIT_DIR, 'final-production-audit.json')
  }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
