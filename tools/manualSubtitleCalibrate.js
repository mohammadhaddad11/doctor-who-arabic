#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const episodes = require('../episodeData');
const streamMetadata = require('../streamMetadata.json');

const ROOT = path.resolve(__dirname, '..');
const AR_DIR = path.join(ROOT, 'ar');
const CSV_PATH = path.join(ROOT, 'audit', 'manual-sync-targets.csv');
const REPORT_JSON_PATH = path.join(ROOT, 'audit', 'manual-sync-report.json');
const REPORT_CSV_PATH = path.join(ROOT, 'audit', 'manual-sync-report.csv');
const SUMMARY_JSON_PATH = path.join(ROOT, 'audit', 'manual-sync-summary.json');

const WRITE = process.argv.includes('--write');

function parseTimecode(value) {
  const match = value.trim().match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!match) {
    return null;
  }
  const [, hh, mm, ss, ms] = match;
  return Number(hh) * 3600000 + Number(mm) * 60000 + Number(ss) * 1000 + Number(ms);
}

function formatTimecode(ms) {
  const clamped = Math.max(0, Math.round(ms));
  const hh = String(Math.floor(clamped / 3600000)).padStart(2, '0');
  const mm = String(Math.floor((clamped % 3600000) / 60000)).padStart(2, '0');
  const ss = String(Math.floor((clamped % 60000) / 1000)).padStart(2, '0');
  const mmm = String(clamped % 1000).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.map((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function parseSrt(text) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const cues = [];
  for (const block of normalized.split(/\n{2,}/)) {
    const lines = block.split('\n').map((line) => line.trimEnd());
    let offset = 0;
    if (/^\d+$/.test(lines[0])) {
      offset = 1;
    }
    if (!lines[offset] || !lines[offset].includes('-->')) {
      continue;
    }
    const [startRaw, endRaw] = lines[offset].split('-->');
    const start = parseTimecode(startRaw);
    const end = parseTimecode(endRaw);
    if (start == null || end == null || end <= start) {
      continue;
    }
    cues.push({
      start,
      end,
      text: lines.slice(offset + 1).join('\n').trim()
    });
  }
  return cues;
}

function stringifySrt(cues) {
  return `\uFEFF${cues.map((cue, index) => [
    index + 1,
    `${formatTimecode(cue.start)} --> ${formatTimecode(cue.end)}`,
    cue.text || ''
  ].join('\n')).join('\n\n')}\n`;
}

function transformTime(value, anchors) {
  if (anchors.length === 1) {
    const delta = anchors[0].targetMs - anchors[0].sourceMs;
    return value + delta;
  }

  if (value <= anchors[0].sourceMs) {
    const [first, second] = anchors;
    const slope = (second.targetMs - first.targetMs) / (second.sourceMs - first.sourceMs);
    const intercept = first.targetMs - slope * first.sourceMs;
    return intercept + slope * value;
  }

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const current = anchors[index];
    const next = anchors[index + 1];
    if (value >= current.sourceMs && value <= next.sourceMs) {
      const slope = (next.targetMs - current.targetMs) / (next.sourceMs - current.sourceMs);
      const intercept = current.targetMs - slope * current.sourceMs;
      return intercept + slope * value;
    }
  }

  const beforeLast = anchors[anchors.length - 2];
  const last = anchors[anchors.length - 1];
  const slope = (last.targetMs - beforeLast.targetMs) / (last.sourceMs - beforeLast.sourceMs);
  const intercept = last.targetMs - slope * last.sourceMs;
  return intercept + slope * value;
}

function transformCues(cues, anchors) {
  return cues.map((cue) => {
    const start = Math.max(0, transformTime(cue.start, anchors));
    const end = Math.max(start + 100, transformTime(cue.end, anchors));
    return { ...cue, start, end };
  });
}

function applySegmentTransform(cues, anchors, segmentStartMs, segmentEndMs) {
  const transformedSegment = transformCues(cues, anchors);
  return cues.map((cue, index) => {
    if (segmentStartMs != null && cue.start < segmentStartMs) {
      return cue;
    }
    if (segmentEndMs != null && cue.start >= segmentEndMs) {
      return cue;
    }
    return transformedSegment[index];
  });
}

function anchorsAreNoop(anchors) {
  return anchors.every((anchor) => anchor.sourceMs === anchor.targetMs);
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function main() {
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
  const grouped = new Map();
  for (const row of rows) {
    const groupKey = [row.canonicalId, row.segmentStart || '', row.segmentEnd || ''].join('|');
    const list = grouped.get(groupKey) || [];
    list.push({
      ...row,
      sourceMs: parseTimecode(row.oldArabicTime),
      targetMs: parseTimecode(row.targetTime),
      segmentStartMs: row.segmentStart ? parseTimecode(row.segmentStart) : null,
      segmentEndMs: row.segmentEnd ? parseTimecode(row.segmentEnd) : null
    });
    grouped.set(groupKey, list);
  }

  const reports = [];
  const summaries = [];
  const summariesByEpisode = new Map();
  const cuesByEpisode = new Map();

  for (const [groupKey, anchors] of grouped.entries()) {
    const [canonicalId] = groupKey.split('|');
    anchors.sort((a, b) => a.sourceMs - b.sourceMs);
    const episode = episodes.find((entry) => `S${String(entry.season).padStart(2, '0')}E${String(entry.episode).padStart(2, '0')}` === canonicalId);
    if (!episode) {
      continue;
    }

    const subtitlePath = path.join(AR_DIR, anchors[0].subtitleFile);
    if (!cuesByEpisode.has(canonicalId)) {
      const beforeText = fs.readFileSync(subtitlePath, 'utf8');
      cuesByEpisode.set(canonicalId, parseSrt(beforeText));
    }

    const beforeCues = cuesByEpisode.get(canonicalId);
    const segmentStartMs = anchors[0].segmentStartMs;
    const segmentEndMs = anchors[0].segmentEndMs;
    const afterCues = anchorsAreNoop(anchors)
      ? beforeCues
      : applySegmentTransform(beforeCues, anchors, segmentStartMs, segmentEndMs);
    cuesByEpisode.set(canonicalId, afterCues);

    const absoluteShifts = anchors.map((anchor) => Math.abs(anchor.targetMs - anchor.sourceMs));
    const streamEntry = streamMetadata.episodes?.[canonicalId];
    const summary = summariesByEpisode.get(canonicalId) || {
      canonicalId,
      title: episode.title,
      subtitleFile: anchors[0].subtitleFile,
      selectedStreamUrl: streamEntry?.primary?.url || episode.streamUrl,
      selected480pUrl: (streamEntry?.alternatives || []).find((entry) => entry.label === '480p')?.url || null,
      quality: anchors[0].quality,
      fixApplied: false,
      fixType: null,
      finalStatus: 'verified',
      anchors: []
    };
    if (absoluteShifts.some((value) => value > 0)) {
      summary.fixApplied = true;
      summary.fixType = 'manual_piecewise';
    }
    summary.anchors.push(...anchors.map((anchor) => ({
      label: anchor.anchorLabel,
      oldArabicTime: anchor.oldArabicTime,
      targetTime: anchor.targetTime,
      appliedShiftSeconds: Number(((anchor.targetMs - anchor.sourceMs) / 1000).toFixed(3)),
      confidence: anchor.confidence,
      segmentStart: anchor.segmentStart || '',
      segmentEnd: anchor.segmentEnd || ''
    })));
    summariesByEpisode.set(canonicalId, summary);

    for (const anchor of anchors) {
      reports.push({
        canonicalId,
        title: episode.title,
        subtitleFile: anchor.subtitleFile,
        quality: anchor.quality,
        segmentStart: anchor.segmentStart || '',
        segmentEnd: anchor.segmentEnd || '',
        anchorLabel: anchor.anchorLabel,
        oldArabicTime: anchor.oldArabicTime,
        targetTime: anchor.targetTime,
        appliedShiftSeconds: ((anchor.targetMs - anchor.sourceMs) / 1000).toFixed(3),
        confidence: anchor.confidence
      });
    }
  }

  if (WRITE) {
    for (const summary of summariesByEpisode.values()) {
      const subtitlePath = path.join(AR_DIR, summary.subtitleFile);
      fs.writeFileSync(subtitlePath, stringifySrt(cuesByEpisode.get(summary.canonicalId)), 'utf8');
    }
  }

  summaries.push(...summariesByEpisode.values());

  const csvHeaders = ['canonicalId', 'title', 'subtitleFile', 'quality', 'segmentStart', 'segmentEnd', 'anchorLabel', 'oldArabicTime', 'targetTime', 'appliedShiftSeconds', 'confidence'];
  const csvOutput = [csvHeaders.join(',')]
    .concat(reports.map((row) => csvHeaders.map((header) => csvEscape(row[header])).join(',')))
    .join('\n') + '\n';

  fs.writeFileSync(REPORT_CSV_PATH, csvOutput, 'utf8');
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), writeApplied: WRITE, entries: reports }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(SUMMARY_JSON_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), writeApplied: WRITE, entries: summaries }, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify({ writeApplied: WRITE, entries: reports.length, csv: REPORT_CSV_PATH, json: REPORT_JSON_PATH, summary: SUMMARY_JSON_PATH }, null, 2) + '\n');
}

main();
