#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const data = require('../vulgarWarnings.json');
const evidence = require('../audit/vulgar-warning-evidence.json');
const episodes = require('../episodeData');
const { episodes: torchwoodEpisodes } = require('../torchwoodData');
const { TORCHWOOD_CLEAN_ENGLISH_SUBTITLES } = require('../subtitleRegistry');
const arabicIndex = require('../torchwoodArabicSubtitles.json');
const {
  appendVulgarWarnings, buildWarningSections, getVulgarWarnings,
  normalizeWarningTerm, renderVulgarWarnings
} = require('../vulgarWarnings');

function validateVulgarWarnings() {
  const root = path.resolve(__dirname, '..');
  const failures = [];
  const missingSources = new Set();
  const expected = new Set();
  const key = (episode) => `S${String(episode.season).padStart(2, '0')}E${String(episode.episode).padStart(2, '0')}`;
  for (const episode of episodes.filter((entry) => entry.streamUrl)) expected.add(`doctorWho:${key(episode)}`);
  for (const episode of torchwoodEpisodes.filter((entry) => entry.streams.length)) expected.add(`torchwood:${key(episode)}`);
  expected.add('movies:doctor-who-movie-1996');
  const seen = new Set();
  const changed = new Set();
  const sourceCache = new Map();
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const entry of evidence.entries) {
    const id = `${entry.show}:${entry.id}`;
    check(expected.has(id) && !seen.has(id), `Unknown or duplicate warning audit entry: ${id}`);
    seen.add(id);
    const warnings = getVulgarWarnings(entry.show, entry.id);
    const raw = data[entry.show]?.[entry.id];
    check(JSON.stringify(warnings.words) === JSON.stringify(entry.wordEvidence.map((item) => item.word)), `${id}: words differ from evidence or contain duplicates`);
    check(JSON.stringify(warnings.actions) === JSON.stringify(entry.actionEvidence.map((item) => item.action)), `${id}: actions differ from evidence`);
    if (raw) {
      changed.add(id);
      check(Object.keys(raw).sort().join(',') === 'actions,words', `${id}: unsupported warning categories`);
      check(JSON.stringify(raw) === JSON.stringify(warnings), `${id}: malformed or duplicate warning terms`);
      check(warnings.words.length + warnings.actions.length > 0, `${id}: empty stored warning`);
    }
    if (entry.show === 'torchwood') {
      const clean = TORCHWOOD_CLEAN_ENGLISH_SUBTITLES[entry.id];
      const en = clean ? `torchwood-subtitles/en-clean/${clean}` : `torchwood-subtitles/en-source/${entry.id}.en.srt`;
      const ar = `torchwood-subtitles/${clean ? 'ar-clean' : 'ar-improved'}/${arabicIndex[entry.id]?.filename}`;
      check(entry.sources.english?.path === en && entry.sources.arabic?.path === ar, `${id}: evidence must use the playable edit and published Arabic`);
    }
    for (const [language, source] of Object.entries(entry.sources)) {
      const fullPath = path.resolve(root, source.path);
      check(fullPath.startsWith(`${root}${path.sep}`), `${id}: invalid evidence path`);
      if (!fullPath.startsWith(`${root}${path.sep}`)) continue;
      if (!fs.existsSync(fullPath)) {
        missingSources.add(source.path);
        continue; // Offline audit cache is not deployed; the evidence snapshot is.
      }
      if (!sourceCache.has(fullPath)) sourceCache.set(fullPath, fs.readFileSync(fullPath));
      const bytes = sourceCache.get(fullPath);
      check(crypto.createHash('sha256').update(bytes).digest('hex') === source.sha256, `${id}: ${language} source changed; review warnings`);
      const text = bytes.toString('utf8').replace(/^\uFEFF/, '').replace(/\r/g, '');
      for (const item of [...entry.wordEvidence, ...entry.actionEvidence].filter((item) => item.language === language)) {
        const cue = new RegExp(`(?:^|\\n)${item.cue}\\n(${item.time.replace(/[.,]/g, '[.,]')})\\s*-->[^\\n]+\\n([\\s\\S]*?)(?=\\n\\d+\\n\\d\\d:|$)`);
        const match = text.match(cue);
        check(Boolean(match), `${id}: missing ${language} evidence cue ${item.cue}`);
        if (item.word && match) check(normalizeWarningTerm(match[2]).includes(normalizeWarningTerm(item.word)), `${id}: term absent from cue ${item.cue}`);
        if (item.action) {
          check(item.basis === 'explicit-subtitle-direction' && match?.[2].trim() === '(KISSING AND SIGHS OF PLEASURE)', `${id}: unconfirmed sexual action`);
        }
      }
    }
    for (const item of [...entry.wordEvidence, ...entry.actionEvidence]) {
      check(Boolean(entry.sources[item.language]) && Number.isInteger(item.cue) && item.cue > 0
        && /^\d\d:\d\d:\d\d[,.]\d{3}$/.test(item.time), `${id}: incomplete evidence reference`);
    }
    check(!renderVulgarWarnings(entry.show, entry.id).includes('<strong>أفعال بذيئة:' ) || warnings.actions.length > 0, `${id}: empty action section`);
  }
  check(expected.size === seen.size && [...expected].every((id) => seen.has(id)), 'Warning audit does not cover every playable entry');
  for (const show of ['doctorWho', 'torchwood', 'movies']) {
    for (const id of Object.keys(data[show])) check(changed.has(`${show}:${id}`), `Warning without audited evidence: ${show}:${id}`);
  }
  try {
    assert.deepEqual(buildWarningSections({ words: ['Sex', 'sex', 'تبًا', 'تبا', ''], actions: [] }), [
      { label: 'كلمات بذيئة', items: ['Sex', 'تبًا'] }
    ]);
    assert.equal(renderVulgarWarnings('torchwood', 'S01E02'), '');
    assert.equal(appendVulgarWarnings('Original overview', 'unknown', 'missing'), 'Original overview');
    assert.deepEqual(buildWarningSections({ words: [], actions: ['تقبيل حميم', 'تقبيل حميم'] }), [
      { label: 'أفعال بذيئة', items: ['تقبيل حميم'] }
    ]);
    for (const [id, word] of [['S01E04', 'sexual'], ['S06E09', 'sexy'], ['S08E09', 'sex']]) {
      assert.ok(getVulgarWarnings('doctorWho', id).words.includes(word));
    }
    for (const [id, word] of [['S02E07', 'جنسي'], ['S04E18', 'قضيب'], ['S07E30', 'dick'], ['S01E11', 'اللعنة']]) {
      assert.ok(!getVulgarWarnings('doctorWho', id).words.includes(word));
    }
  } catch (error) {
    failures.push(`Warning presentation regression: ${error.message}`);
  }
  return { failures, audited: seen.size, changed: changed.size, unavailableOfflineSources: missingSources.size };
}

if (require.main === module) {
  const result = validateVulgarWarnings();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.failures.length ? 1 : 0;
}

module.exports = { validateVulgarWarnings };
