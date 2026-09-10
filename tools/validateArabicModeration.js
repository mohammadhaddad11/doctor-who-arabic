#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const {
  BLOCKED_ARABIC_TERMS,
  ENGLISH_PROFANITY_TERMS,
  EXPLICIT_ARABIC_PHRASES,
  GRAPHIC_ANATOMY_TERMS,
  MAX_SUBTITLE_LINE_LENGTH,
  MEDICAL_CONTEXT_TERMS,
  TORCHWOOD_ARABIC_SUBTITLE_DIRECTORIES
} = require('../torchwoodArabicModeration');

const ROOT = path.resolve(__dirname, '..');
const TIMESTAMP_PATTERN = /^(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})$/;

function listSrtFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSrtFiles(filePath);
    }
    return entry.isFile() && /\.srt$/i.test(entry.name) ? [filePath] : [];
  });
}

function parseTimestamp(match, offset) {
  const hours = Number(match[offset]);
  const minutes = Number(match[offset + 1]);
  const seconds = Number(match[offset + 2]);
  const milliseconds = Number(match[offset + 3]);
  if (minutes >= 60 || seconds >= 60 || milliseconds >= 1000) {
    return null;
  }
  return (((hours * 60) + minutes) * 60 + seconds) * 1000 + milliseconds;
}

function containsWholeTerm(line, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(line);
}

function normalizeForPolicy(line) {
  return line
    .normalize('NFKC')
    .replace(/\u0640/g, '')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '');
}

function isMostlyArabic(line) {
  const visible = line.replace(/<[^>]*>/g, '');
  const lettersAndNumbers = visible.match(/[\p{L}\p{N}]/gu) || [];
  const arabic = visible.match(/[\u0600-\u06ff]/gu) || [];
  return lettersAndNumbers.length > 0 && arabic.length / lettersAndNumbers.length >= 0.6;
}

function validateTextLine(line, location, failures, warnings) {
  const plainLine = line.replace(/<[^>]*>/g, '').trim();
  if (!plainLine) {
    return;
  }
  const policyLine = normalizeForPolicy(plainLine);
  if (BLOCKED_ARABIC_TERMS.some((term) => containsWholeTerm(policyLine, term))) {
    failures.push(`${location}: blocked Arabic wording requires moderation`);
  }
  if (EXPLICIT_ARABIC_PHRASES.some((phrase) => policyLine.includes(phrase))) {
    warnings.push(`${location}: explicit wording requires contextual moderation review`);
  }
  const hasGraphicAnatomy = GRAPHIC_ANATOMY_TERMS.some((term) => containsWholeTerm(policyLine, term));
  const hasMedicalContext = MEDICAL_CONTEXT_TERMS.some((term) => policyLine.includes(term));
  if (hasGraphicAnatomy && !hasMedicalContext) {
    warnings.push(`${location}: anatomical wording needs medical or plot-context review`);
  }
  if (ENGLISH_PROFANITY_TERMS.some((term) => containsWholeTerm(policyLine, term))) {
    warnings.push(`${location}: possible untranslated English profanity`);
  }
  if ([...plainLine].length > MAX_SUBTITLE_LINE_LENGTH) {
    warnings.push(`${location}: line exceeds ${MAX_SUBTITLE_LINE_LENGTH} characters`);
  }
  if (isMostlyArabic(plainLine) && /[.!?:;]$/.test(plainLine) && !plainLine.includes('\u200f')) {
    warnings.push(`${location}: Arabic line ends with neutral ASCII punctuation; review Arabic punctuation or RLM rendering`);
  }
}

function validateSrt(text, filename) {
  const failures = [];
  const warnings = [];
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (normalized !== normalized.normalize('NFC')) {
    warnings.push(`${filename}: text is not normalized as Unicode NFC`);
  }
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) {
    return { failures: [`${filename}: no subtitle cues found`], warnings, cueCount: 0 };
  }

  let previousStart = -1;
  blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const cueLabel = `${filename}: cue ${index + 1}`;
    if (Number(lines[0]) !== index + 1) {
      failures.push(`${cueLabel}: cue number is missing or out of order`);
    }
    const timestampLine = (lines[1] || '').trim();
    if (/^-/.test(timestampLine) || /-->\s*-/.test(timestampLine)) {
      failures.push(`${cueLabel}: negative timestamp is not allowed`);
      return;
    }
    const match = timestampLine.match(TIMESTAMP_PATTERN);
    if (!match) {
      failures.push(`${cueLabel}: invalid SRT timestamp format`);
      return;
    }
    const start = parseTimestamp(match, 1);
    const end = parseTimestamp(match, 5);
    if (start === null || end === null || end <= start) {
      failures.push(`${cueLabel}: invalid timestamp range`);
      return;
    }
    if (start < previousStart) {
      failures.push(`${cueLabel}: cue starts before the previous cue`);
    }
    previousStart = start;
    const textLines = lines.slice(2).filter((line) => line.trim());
    if (!textLines.length) {
      failures.push(`${cueLabel}: empty cue`);
      return;
    }
    textLines.forEach((line, lineIndex) => {
      validateTextLine(line, `${cueLabel}, line ${lineIndex + 1}`, failures, warnings);
    });
  });
  return { failures, warnings, cueCount: blocks.length };
}

function main() {
  const subtitleFiles = TORCHWOOD_ARABIC_SUBTITLE_DIRECTORIES
    .flatMap((relativePath) => listSrtFiles(path.join(ROOT, relativePath)))
    .sort();
  const failures = [];
  const warnings = [];
  let cueCount = 0;

  for (const filePath of subtitleFiles) {
    const relativePath = path.relative(ROOT, filePath);
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(filePath));
    } catch (error) {
      failures.push(`${relativePath}: invalid UTF-8 (${error.message})`);
      continue;
    }
    const result = validateSrt(text, relativePath);
    failures.push(...result.failures);
    warnings.push(...result.warnings);
    cueCount += result.cueCount;
  }

  const result = {
    status: failures.length ? 'error' : warnings.length ? 'warning' : 'ok',
    filesChecked: subtitleFiles.length,
    cuesChecked: cueCount,
    failures,
    warnings
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  normalizeForPolicy,
  validateSrt
};
