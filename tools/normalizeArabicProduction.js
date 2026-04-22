#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AR_DIR = path.join(ROOT, 'ar');
const AUDIT_DIR = path.join(ROOT, 'audit');
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

function scoreDecodedText(text) {
  const arabicChars = text.match(/[\u0600-\u06FF]/g) || [];
  const cueMarkers = text.match(/-->/g) || [];
  const replacementChars = text.match(/\uFFFD/g) || [];
  const mojibakeChars = text.match(/[ÃØÙÞ]/g) || [];
  const suspiciousArabic = text.match(/[طظ]/g) || [];
  const suspiciousRatio = arabicChars.length ? suspiciousArabic.length / arabicChars.length : 0;

  return (
    cueMarkers.length * 20 +
    arabicChars.length * 2 -
    replacementChars.length * 20 -
    mojibakeChars.length * 10 -
    (suspiciousRatio > 0.35 ? suspiciousRatio * 20000 : 0)
  );
}

function decodeSubtitle(buffer) {
  const attempts = [
    () => new TextDecoder('utf-8', { fatal: true }).decode(buffer),
    () => new TextDecoder('utf-8').decode(buffer),
    () => new TextDecoder('windows-1256').decode(buffer),
    () => new TextDecoder('iso-8859-6').decode(buffer),
    () => buffer.toString('latin1')
  ];

  let best = '';
  let bestScore = -Infinity;

  for (const attempt of attempts) {
    try {
      const text = attempt();
      const variants = [text];
      try {
        variants.push(Buffer.from(text, 'latin1').toString('utf8'));
      } catch {
        // ignore
      }
      for (const variant of variants) {
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

function normalizeSubtitleText(text) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u200f/g, '')
    .replace(/\u0000/g, '')
    .trim();

  return `${normalized.replace(/\n/g, '\r\n')}\r\n`;
}

function looksProblematic(text) {
  const cueCount = (text.match(/-->/g) || []).length;
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  return cueCount === 0 || replacementCount > 0;
}

async function main() {
  const files = (await fsp.readdir(AR_DIR))
    .filter((file) => file.endsWith('.srt'))
    .sort();

  const results = [];

  for (const file of files) {
    const fullPath = path.join(AR_DIR, file);
    const originalBuffer = await fsp.readFile(fullPath);
    const decoded = decodeSubtitle(originalBuffer);
    const normalizedText = normalizeSubtitleText(decoded);
    const normalizedBuffer = Buffer.concat([UTF8_BOM, Buffer.from(normalizedText, 'utf8')]);
    const rewritten = !originalBuffer.equals(normalizedBuffer);

    if (rewritten) {
      await fsp.writeFile(fullPath, normalizedBuffer);
    }

    results.push({
      file,
      rewritten,
      problematic: looksProblematic(normalizedText),
      cueCount: (normalizedText.match(/-->/g) || []).length,
      arabicChars: (normalizedText.match(/[\u0600-\u06FF]/g) || []).length
    });
  }

  const summary = {
    totalFiles: results.length,
    converted: results.filter((item) => item.rewritten).length,
    problematic: results.filter((item) => item.problematic).map((item) => item.file)
  };

  await fsp.mkdir(AUDIT_DIR, { recursive: true });
  await fsp.writeFile(
    path.join(AUDIT_DIR, 'encoding-audit.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, files: results }, null, 2)}\n`
  );

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
