#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const warnings = require('../vulgarWarnings.json');
const evidence = require('../audit/vulgar-warning-evidence.json');
const { buildWarningSections } = require('../vulgarWarnings');
const { TORCHWOOD_EPISODE_TAGS, buildTorchwoodEpisodeTagLine } = require('../torchwoodEpisodeTags');

const changed = evidence.entries.filter((entry) => warnings[entry.show]?.[entry.id]);
const cell = (value) => value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
const oldWarning = (entry) => entry.show === 'torchwood'
  ? buildTorchwoodEpisodeTagLine(TORCHWOOD_EPISODE_TAGS[entry.id]).match(/\[Content: ([^\]]+)\]/)?.[1] || '—'
  : '—';
const counts = Object.fromEntries(['doctorWho', 'torchwood', 'movies'].map((show) => [show, changed.filter((entry) => entry.show === show).length]));
const lines = [
  '# Vulgar/sexual warning audit', '',
  `Audited **${evidence.entries.length} playable entries**: 239 Doctor Who episodes/specials, 40 Torchwood episodes and the 1996 movie.`,
  `**${changed.length} changed entries**: ${counts.doctorWho} Doctor Who, ${counts.torchwood} Torchwood, ${counts.movies} movie.`,
  `${evidence.entries.length - changed.length} entries have no qualifying warning in the reviewed evidence; their empty sections are hidden.`, '',
  '## Evidence and scope', '',
  '- Only vulgar/sexual language and evidence-backed sensual/sexual actions were audited.',
  '- The table contains changed entries only. “Previous warning” is the previous content-warning label; existing importance, quality, edit/version and unrelated content tags remain in place.',
  '- Words are short actual subtitle matches, deduplicated ignoring case and Arabic diacritics. English and Arabic equivalents may both appear when both are present in the reviewed subtitles.',
  '- Whole-word matching and reviewed context exclusions remove species/gender uses, literal curses, rods/equipment, neutral anatomy, religious titles, proper names and “and tomorrow” Arabic false positives.',
  '- Explicit sex/sexual/sexy dialogue qualifies as language. Dialogue about sex, requests to kiss/undress, and accounts of past sex do not prove an action in the playable scene.',
  '- One entry has a directly confirmed sensual-action description: Doctor Who S05E14, caption 654 at 00:38:23,120, “KISSING AND SIGHS OF PLEASURE”. The wording describes kissing and sounds, without asserting intercourse.',
  '- Other action candidates lack sufficiently specific current-scene evidence and are omitted. This is a subtitle/documentation audit, not a visual review or a certification that those videos contain no sexual actions.',
  '- Ordinary/family kisses and non-sexual pain/monster moans are excluded. Torchwood “Sexual scene removed” is a version note, not evidence of a remaining sexual scene. Clean cuts use their exact English timeline and published clean Arabic.',
  '- Torchwood S01E02 is unavailable and excluded. The movie uses its existing Arabic subtitle source; no English movie transcript was available locally.',
  '- Per-word/per-action source paths, SHA-256 digests, cue numbers and timestamps for all 280 entries are in [vulgar-warning-evidence.json](vulgar-warning-evidence.json). Long subtitle quotations are not reproduced.', '',
  '## Changed entries', '',
  '| Show / ID | Title | Previous warning | Actual words | Confirmed actions | New detailed warning |',
  '| --- | --- | --- | --- | --- | --- |'
];
for (const entry of changed) {
  const current = warnings[entry.show][entry.id];
  const label = { doctorWho: 'Doctor Who', torchwood: 'Torchwood', movies: 'Movie' }[entry.show];
  const text = buildWarningSections(current).map(({ label: heading, items }) => `${heading}: ${items.join('، ')}`).join('\n');
  lines.push(`| ${label} ${entry.id} | ${cell(entry.title)} | ${oldWarning(entry)} | ${cell(current.words.join('، ') || '—')} | ${cell(current.actions.join('، ') || '—')} | ${cell(text)} |`);
}
lines.push('', '## Rebuilding and validation', '',
  'The offline corpus includes the local Doctor Who English audit cache and Torchwood original English sources. With those present:', '',
  '```sh', 'python3 tools/buildVulgarWarnings.py', 'node tools/buildVulgarWarningReport.js',
  'npm run check', 'git diff --check', '```', '',
  '`npm run check` validates complete playable-entry coverage, deduplication, empty sections, explicit sexual-word examples, contextual exclusions, exact clean-edit sources and cue/hash evidence for local sources. Offline English sources are not required by the deployed presentation module.', '');
fs.writeFileSync(path.join(__dirname, '..', 'audit', 'vulgar-warning-changes.md'), lines.join('\n'));
console.log(`Wrote warning report for ${changed.length} changed entries.`);
