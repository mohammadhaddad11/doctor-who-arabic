#!/usr/bin/env node
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const episodes = require('../episodeData');

const ROOT = path.resolve(__dirname, '..');
const METADATA_DIR = path.join(ROOT, '.subtitle-audit-cache', 'metadata');
const OUTPUT_PATH = path.join(ROOT, 'streamMetadata.json');

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

function isSpecialEpisode(title = '') {
  return /special|minisode|prequel/i.test(title);
}

function qualifyBackup(episode, original, backup) {
  if (!isSpecialEpisode(episode.title)) {
    return false;
  }

  const originalSize = Number(original.size || 0);
  const backupSize = Number(backup.size || 0);
  const originalWidth = Number(original.width || 0);
  const backupWidth = Number(backup.width || 0);
  const originalLength = Number(original.length || 0);
  const backupLength = Number(backup.length || 0);

  if (!originalSize || !backupSize || backupSize >= originalSize) {
    return false;
  }

  const sizeRatio = backupSize / originalSize;
  const closeRuntime = Math.abs(originalLength - backupLength) <= 90;
  const isLargeOriginal = originalSize >= 1.5 * 1024 * 1024 * 1024;
  const isMeaningfullySmaller = sizeRatio <= 0.35;
  const isLowerResolution = backupWidth > 0 && originalWidth > 0 && backupWidth < originalWidth;

  return closeRuntime && isLargeOriginal && isMeaningfullySmaller && isLowerResolution;
}

async function loadArchiveMetadata() {
  const files = await fsp.readdir(METADATA_DIR);
  const byName = new Map();

  for (const file of files.filter((name) => name.endsWith('.json')).sort()) {
    const fullPath = path.join(METADATA_DIR, file);
    const data = JSON.parse(await fsp.readFile(fullPath, 'utf8'));
    for (const entry of data.files || []) {
      byName.set(entry.name, entry);
    }
  }

  return byName;
}

async function main() {
  const metadataByName = await loadArchiveMetadata();
  const output = {};

  for (const episode of episodes) {
    if (!episode.streamUrl) {
      continue;
    }

    const streamFilename = episode.streamUrl.split('/').pop();
    const original = metadataByName.get(streamFilename);
    if (!original) {
      continue;
    }

    const backupFilename = streamFilename.replace(/\.mp4$/i, '.ia.mp4');
    const backup = metadataByName.get(backupFilename);
    const originalSize = Number(original.size || 0);

    output[streamFilename] = {
      sizeBytes: originalSize,
      sizeLabel: formatBytes(originalSize)
    };

    if (backup && qualifyBackup(episode, original, backup)) {
      output[streamFilename].backup = {
        url: episode.streamUrl.replace(/\.mp4$/i, '.ia.mp4'),
        sizeBytes: Number(backup.size || 0),
        sizeLabel: formatBytes(Number(backup.size || 0)),
        qualityLabel: `${backup.height || backup.width || 'lower-res'}p`
      };
    }
  }

  await fsp.writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ written: OUTPUT_PATH, entries: Object.keys(output).length }, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
