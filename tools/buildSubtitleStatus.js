#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const arabicSubtitleFiles = require('../arabicSubtitles.json');
const finalAudit = require('../audit/final-production-audit.json');

const OUTPUT_PATH = path.join(ROOT, 'subtitleStatus.json');
const SPECIAL_AUDIT_PATH = path.join(ROOT, 'audit', 'special-subtitle-audit.json');

const SPECIAL_TITLES = new Set([
  'The Christmas Invasion (Special)',
  'The Runaway Bride (Special)',
  'The Time of the Doctor (Special)',
  'The Day of the Doctor (Special)',
  'The Snowmen (Special)',
  'Voyage of the Damned (Special)',
  'The End of Time, Part One (Special)',
  'The End of Time, Part Two (Special)',
  'A Christmas Carol (Special)',
  'Eve of the Daleks (Special)',
  'Legend of the Sea Devils (Special)',
  'The Power of the Doctor (Special)',
  'The Star Beast (Special)',
  'Wild Blue Yonder (Special)',
  'The Giggle (Special)',
  'The Church on Ruby Road (Special)',
  'The Lazarus Experiment'
]);

function statusFromAudit(finalStatus) {
  switch (finalStatus) {
    case 'PASS':
    case 'FIXED_CONSTANT_OFFSET':
    case 'FIXED_DRIFT':
      return 'verified';
    case 'PASS_WITH_MINOR_OFFSET':
      return 'minor_offset';
    case 'MANUAL_REVIEW':
      return 'manual_review';
    case 'LOW_CONFIDENCE':
    case 'WRONG_EPISODE':
      return 'warning';
    default:
      return 'unknown';
  }
}

function summaryCounts(entries) {
  const counts = {
    verified: 0,
    minor_offset: 0,
    warning: 0,
    manual_review: 0,
    unknown: 0
  };

  for (const entry of Object.values(entries)) {
    counts[entry.status] = (counts[entry.status] || 0) + 1;
  }

  return counts;
}

const entries = {};
for (const filename of arabicSubtitleFiles) {
  entries[filename] = {
    filename,
    status: 'unknown',
    auditStatus: null,
    title: null,
    canonicalId: null,
    syncFixType: null,
    manualReplacement: false,
    note: 'No production audit finding was matched for this subtitle yet.'
  };
}

for (const finding of finalAudit.findings || []) {
  const entry = entries[finding.filename];
  if (!entry) {
    continue;
  }

  entry.status = statusFromAudit(finding.finalStatus);
  entry.auditStatus = finding.finalStatus;
  entry.title = finding.title;
  entry.canonicalId = finding.canonicalId;
  entry.syncFixType = finding.syncFixType;
  entry.manualReplacement = Boolean(finding.manualReplacement);
  entry.note = finding.syncFixType
    ? `Production subtitle was previously repaired with a ${finding.syncFixType.replace(/_/g, ' ')} fix and remains visible.`
    : finding.manualReplacement
      ? 'Production subtitle uses a manually selected replacement source.'
      : 'Production subtitle passed the stored audit.';
}

const summary = summaryCounts(entries);
const specialAuditEntries = (finalAudit.findings || [])
  .filter((finding) => SPECIAL_TITLES.has(finding.title))
  .map((finding) => ({
    canonicalId: finding.canonicalId,
    title: finding.title,
    filename: finding.filename,
    status: statusFromAudit(finding.finalStatus),
    auditStatus: finding.finalStatus,
    syncFixType: finding.syncFixType,
    manualReplacement: Boolean(finding.manualReplacement),
    linearOffsetSeconds: finding.linearOffsetSeconds,
    windowShiftSeconds: finding.windowShiftSeconds,
    rawF1: finding.rawF1,
    fixedF1: finding.fixedF1,
    coverageGapSeconds: finding.coverageGapSeconds
  }));

const specialSummary = {
  total: specialAuditEntries.length,
  verified: specialAuditEntries.filter((entry) => entry.status === 'verified').length,
  minor_offset: specialAuditEntries.filter((entry) => entry.status === 'minor_offset').length,
  warning: specialAuditEntries.filter((entry) => entry.status === 'warning').length,
  manual_review: specialAuditEntries.filter((entry) => entry.status === 'manual_review').length
};

fs.writeFileSync(
  OUTPUT_PATH,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
    entries
  }, null, 2)}\n`
);

fs.writeFileSync(
  SPECIAL_AUDIT_PATH,
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: specialSummary,
    entries: specialAuditEntries
  }, null, 2)}\n`
);

process.stdout.write(`${JSON.stringify({ subtitleStatus: OUTPUT_PATH, specialAudit: SPECIAL_AUDIT_PATH, summary, specialSummary }, null, 2)}\n`);
