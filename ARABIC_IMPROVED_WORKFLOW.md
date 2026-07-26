# Arabic Improved Subtitle Workflow

## Reusable Commands

Reusable Phase 1 command:

```text
"Continue the next Arabic Improved staging episode using ARABIC_IMPROVED_WORKFLOW.md."
```

Reusable Phase 2 command:

```text
"Integrate staged Arabic Improved subtitles using ARABIC_IMPROVED_WORKFLOW.md."
```

## 1. Project Goal

Arabic Improved is a professional Arabic subtitle track built from the English subtitles. It should provide clean viewer subtitles, not SDH/closed captions, and improve translation quality while preserving the original timing.

The workflow is now split into two phases:

- Phase 1 stages translated subtitles in `ar-improved-staging/` without adding them to the addon.
- Phase 2 integrates already staged subtitles into `ar-improved/` and the addon mapping after separate verification.

## 2. Current Status

### Phase 1 — Translation Staging Status

Last staged episode: S08E09 Mummy on the Orient Express
Next staging target episode: S08E10 Flatline
Staged Arabic Improved count: 0
Date: 2026-07-17

Staged episodes pending integration:
- none

### Phase 2 — Integration Status

Last completed episode: S08E09 Mummy on the Orient Express
Next target episode: S08E10 Flatline
Completed Arabic Improved count: 120
Date: 2026-07-17

Already completed:
- S02E13 Doomsday
- S02E14 The Runaway Bride Special
- S03E01 Smith and Jones
- S03E02 The Shakespeare Code
- S03E03 Gridlock
- S03E04 Daleks in Manhattan
- S03E05 Evolution of the Daleks
- S03E06 The Infinite Quest (Animated Series)
- S03E07 The Lazarus Experiment
- S03E08 42
- S03E09 Human Nature
- S03E10 The Family of Blood
- S03E11 Blink
- S03E12 Utopia
- S03E13 The Sound of Drums
- S03E14 Last of the Time Lords
- S03E15 Time Crash Minisode
- S03E16 Voyage of the Damned Special
- S04E01 Partners in Crime
- S04E02 The Fires of Pompeii
- S04E03 Planet of the Ood
- S04E04 The Sontaran Stratagem
- S04E05 The Poison Sky
- S04E06 The Doctor's Daughter
- S04E07 The Unicorn and the Wasp
- S04E08 Silence in the Library
- S04E09 Forest of the Dead
- S04E10 Midnight
- S04E11 Turn Left
- S04E12 The Stolen Earth
- S04E13 Journey's End
- S04E14 Music of the Spheres Minisode
- S04E15 The Next Doctor Special
- S04E16 Planet of the Dead Special
- S04E17 The Waters of Mars Special
- S04E18 Dreamland Animated Series
- S04E19 The End of Time Part One Special
- S04E20 The End of Time Part Two Special
- S05E01 The Eleventh Hour
- S05E02 The Beast Below
- S05E03 Victory of the Daleks
- S05E04 The Time of Angels
- S05E05 Flesh and Stone
- S05E06 The Vampires of Venice
- S05E07 Amy's Choice
- S05E08 The Hungry Earth
- S05E09 Cold Blood
- S05E10 Vincent and the Doctor
- S05E11 The Lodger
- S05E12 The Pandorica Opens
- S05E13 The Big Bang
- S05E14 A Christmas Carol Special
- S06E01 The Impossible Astronaut
- S06E02 Day of the Moon
- S06E03 The Curse of the Black Spot
- S06E04 The Doctor's Wife
- S06E05 The Rebel Flesh
- S06E06 The Almost People
- S06E07 A Good Man Goes to War
- S06E08 Let's Kill Hitler
- S06E09 Night Terrors
- S06E10 The Girl Who Waited
- S06E11 The God Complex
- S06E12 Closing Time
- S06E13 The Wedding of River Song
- S06E14 The Doctor, the Widow and the Wardrobe Special
- S07E01 Asylum of the Daleks
- S07E02 Dinosaurs on a Spaceship
- S07E03 A Town Called Mercy
- S07E04 The Power of Three
- S07E05 The Angels Take Manhattan
- S07E06 The Snowmen Special
- S07E07 The Bells of Saint John
- S07E08 The Rings of Akhaten
- S07E09 Cold War
- S07E10 Hide
- S07E11 Journey to the Centre of the TARDIS
- S07E12 The Crimson Horror
- S07E13 Nightmare in Silver
- S07E14 The Name of the Doctor
- S07E15 The Night of the Doctor Minisode
- S07E16 The Last Day Minisode
- S07E17 The Day of the Doctor Special
- S07E18 The Time of the Doctor Special
- S08E01 Deep Breath (Prequel)
- S08E02 Deep Breath
- S08E03 Into the Dalek
- S08E04 Robot of Sherwood
- S08E05 Listen
- S08E06 Time Heist
- S08E07 The Caretaker
- S08E08 Kill the Moon
- S08E09 Mummy on the Orient Express

Staged episodes already integrated:
- S05E09 Cold Blood
- S05E10 Vincent and the Doctor
- S05E11 The Lodger
- S05E12 The Pandorica Opens
- S05E13 The Big Bang
- S05E14 A Christmas Carol Special
- S06E01 The Impossible Astronaut
- S06E02 Day of the Moon
- S06E03 The Curse of the Black Spot
- S06E04 The Doctor's Wife
- S06E05 The Rebel Flesh
- S06E06 The Almost People
- S06E07 A Good Man Goes to War
- S06E08 Let's Kill Hitler
- S06E09 Night Terrors
- S06E10 The Girl Who Waited
- S06E11 The God Complex
- S06E12 Closing Time
- S06E13 The Wedding of River Song
- S06E14 The Doctor, the Widow and the Wardrobe Special
- S07E01 Asylum of the Daleks
- S07E02 Dinosaurs on a Spaceship
- S07E03 A Town Called Mercy
- S07E04 The Power of Three
- S07E05 The Angels Take Manhattan
- S07E06 The Snowmen Special
- S07E07 The Bells of Saint John
- S07E08 The Rings of Akhaten
- S07E09 Cold War
- S07E10 Hide
- S07E11 Journey to the Centre of the TARDIS
- S07E12 The Crimson Horror
- S07E13 Nightmare in Silver
- S07E14 The Name of the Doctor
- S07E15 The Night of the Doctor Minisode
- S07E16 The Last Day Minisode
- S07E17 The Day of the Doctor Special
- S07E18 The Time of the Doctor Special
- S08E01 Deep Breath (Prequel)
- S08E02 Deep Breath
- S08E03 Into the Dalek
- S08E04 Robot of Sherwood
- S08E05 Listen
- S08E06 Time Heist
- S08E07 The Caretaker
- S08E08 Kill the Moon
- S08E09 Mummy on the Orient Express

## 3. Global Rules

- Use GPT-5.5 for the whole task.
- Do not ask the user to switch models.
- Use Fast Staging Mode for every Phase 1 pass.
- Do not translate more than one episode in a Phase 1 pass.
- Do not inspect unrelated episodes.
- Do not inspect old Arabic subtitles.
- Do not inspect Arabic Alt.
- Do not print full SRT diffs.
- Do not commit or push unless the user explicitly asks.
- Do not remove old Arabic subtitles.
- Do not rename or delete Arabic Alt.
- Use the local English SRT as the only translation source during Phase 1.

## 4. File Scope By Phase

### Phase 1 Allowed Files

During Translation Staging, read only:

- `ARABIC_IMPROVED_WORKFLOW.md`
- the matching target English SRT from `.subtitle-audit-cache/english/`
- the target staged Arabic SRT in `ar-improved-staging/` only if resuming an existing staged file

During Translation Staging, modify only:

- `ARABIC_IMPROVED_WORKFLOW.md`
- the target staged Arabic SRT in `ar-improved-staging/`

During Phase 1, do not modify:

- `arabicImprovedSubtitles.json`
- `ar-improved/`
- `episodeData.js`
- stream logic
- old Arabic subtitles
- Arabic Alt subtitles
- unrelated English SRT files

### Phase 2 Allowed Files

During Integration, inspect or modify only:

- `ARABIC_IMPROVED_WORKFLOW.md`
- staged SRT files from `ar-improved-staging/`
- final integrated SRT files in `ar-improved/`
- `arabicImprovedSubtitles.json`
- `episodeData.js` for read-only canonical ID/title verification
- validation scripts or package files only if needed to understand validation output

During Phase 2, do not:

- retranslate staged subtitles
- inspect old Arabic subtitles
- inspect Arabic Alt subtitles
- inspect unrelated episodes beyond canonical ID/title verification needed for integration
- change stream logic

## 5. Phase 1 — Translation Staging

Phase 1 creates a staged Arabic Improved subtitle file, but does not add it to the addon yet.

### Fast Staging Mode

- Do not re-diagnose the whole workflow for each episode.
- Read only `ARABIC_IMPROVED_WORKFLOW.md`, the target English SRT, and the target staged SRT only if resuming.
- Work on one episode only.
- Do not inspect old Arabic, Arabic Alt, `ar-improved/`, or unrelated episodes.
- Do not print full SRT diffs.
- Do not print long explanations or examples unless validation fails.
- Keep Phase 2 integration separate and later.

### Phase 1 Inputs

- Read `Next staging target episode` from this workflow file.
- Use only the matching English SRT from `.subtitle-audit-cache/english/`.
- If the matching English SRT is ambiguous or missing, stop and ask for clarification.
- If the staged file already exists and is partial, continue from the last completed source cue.
- Do not restart unless the partial staged file is corrupted.
- Do not use old Arabic subtitles as a reference.
- Do not use Arabic Alt subtitles as a reference.

### Phase 1 Output

- Create or update only the translated Arabic SRT in `ar-improved-staging/`.
- Use a predictable filename with the episode ID and English source slug, for example `S05E09_cold_blood.improved.ar.srt`.
- If the canonical filename is unclear, use the staged filename that best matches the target title; Phase 2 will verify canonical ID and title before integration.
- Do not copy the staged file into `ar-improved/`.
- Do not update `arabicImprovedSubtitles.json`.
- Do not make the subtitle available to the addon during Phase 1.

### Phase 1 Translation Rules

- Translate every spoken line naturally into Arabic.
- Preserve timestamps.
- Preserve cue order.
- Do not summarize.
- Do not merge cues.
- Do not split cues.
- Translate first, then remove standalone non-speech cues after translation.
- Remove standalone non-speech cues entirely.
- If a cue has both non-speech and dialogue, remove only the non-speech part and keep the dialogue.
- Renumber retained cues sequentially after removing standalone non-speech cues.
- Use professional Modern Standard Arabic.
- Keep subtitles natural, cinematic, and watchable.
- Preserve tone and humor.
- Keep lines readable.
- Avoid broken Arabic, awkward phrasing, spelling errors, and malformed punctuation.
- Do not leave unexplained English except names or approved terms.

### Phase 1 QA Rules

- Validate staged SRT structure.
- Confirm cue count equals source cue count minus removed standalone non-speech cues.
- Confirm retained timestamps match retained source timestamps.
- Search for English leftovers.
- Search for bracketed or parenthesized SDH leftovers.
- Check for empty cues.
- Check for orphan dialogue dashes after removing inline non-speech captions.
- Run pronoun/gender QA silently using episode context.

### Phase 1 Workflow Update

After staging one episode, update only `ARABIC_IMPROVED_WORKFLOW.md`:

- Last staged episode = staged episode.
- Next staging target episode = next unstaged episode.
- Staged Arabic Improved count = updated staged count.
- Add staged episode under `Staged episodes pending integration`.
- Do not add it under `Already completed`.
- Do not change `Last completed episode`.
- Do not change `Completed Arabic Improved count`.
- Do not update `arabicImprovedSubtitles.json`.

### Phase 1 Final Report Format

```text
episode:
source cues:
final cues:
removed non-speech:
QA:
workflow updated:
files changed:
ready for integration:
```

## 6. Phase 2 — Integration

Phase 2 integrates already staged Arabic Improved subtitles into the addon. This phase happens later and must not retranslate.

### Phase 2 Inputs

- Use staged SRT files from `ar-improved-staging/`.
- Do not retranslate staged files.
- Verify canonical episode ID and title from `episodeData.js`.
- Verify the staged subtitle matches the intended canonical episode.

### Phase 2 Actions

- Copy or move staged SRT files into `ar-improved/`.
- Use the canonical final filename for `ar-improved/`.
- Update `arabicImprovedSubtitles.json` with the canonical episode ID and final filename.
- Update `ARABIC_IMPROVED_WORKFLOW.md`.
- Mark integrated staged episodes as integrated.
- Remove integrated episodes from `Staged episodes pending integration` or move them to `Staged episodes already integrated`.
- Do not retranslate.
- Do not alter subtitle wording except for mechanical fixes required by validation, such as numbering, timestamp format, or filename mismatch.

### Phase 2 Workflow Update

After integration, update `ARABIC_IMPROVED_WORKFLOW.md`:

- Last completed episode = latest integrated episode.
- Next target episode = next missing non-integrated episode.
- Completed Arabic Improved count = updated integrated count.
- Add integrated episode under `Already completed` if not already listed.
- Mark staged episodes as integrated.
- Keep Phase 1 staging status accurate.

### Phase 2 Validation Commands

Run both commands after integration:

```bash
npm run validate:improved-arabic
npm run check
```

### Phase 2 Final Report Format

```text
integrated episodes:
canonical verification:
validation result:
files changed:
ready to use:
```

## 7. Arabic Improved Priority Rule

- Integrated Arabic Improved subtitles in `ar-improved/` should be treated as the primary Arabic subtitle track for that episode.
- Staged subtitles in `ar-improved-staging/` are not primary tracks yet.
- Staged subtitles must not be exposed through the addon until Phase 2 integration is complete.
- Old Arabic subtitles remain backup/fallback.
- For episodes without integrated Arabic Improved subtitles, the old Arabic subtitle remains the normal Arabic track.
- This priority applies episode-by-episode as work progresses, not only after the whole season is finished.

## 8. Doctor Who Terminology

- Doctor = `الدكتور`
- TARDIS = `التارديس`
- sonic screwdriver = `المفك الصوتي`
- Dalek = `داليك`
- Time Lord = `سيد الزمن`
- Earth = `الأرض`
- aliens = `كائنات فضائية`
- Rose = `روز`

## 9. Bracketed And Non-Speech Handling Policy

### A) Removed Standalone

Standalone non-speech captions should be removed entirely.

Example:

```text
English: (footsteps)
Arabic decision: remove cue entirely
```

### B) Removed Inline But Kept Dialogue

If a cue contains both non-speech information and dialogue, remove only the non-speech part and keep the dialogue.

Example:

```text
English:
(door opens)
What was that?

Final Arabic:
ما كان ذلك؟
```

### C) Kept Or Converted Important Context

Only keep non-speech context if it is necessary to understand the scene and cannot be inferred visually.

Example:

```text
English:
(over speaker) Evacuate immediately.

Final Arabic:
عبر مكبر الصوت: أخلوا المكان فورًا.
```

## 10. Pronoun And Gender Accuracy Rules

English pronouns are often ambiguous, especially `you`, `your`, and `yourself`. Arabic Improved must not guess randomly.

For every staged episode, after translation and before final QA, run a dedicated pronoun/gender review pass:

1. Identify speaker and addressee from episode context.
2. For every ambiguous English `you`, choose Arabic gender/number from context.
3. If the addressee is male singular, use masculine Arabic forms.
4. If the addressee is female singular, use feminine Arabic forms.
5. If the addressee is plural or a group, use plural Arabic forms.
6. Use nearby cues before and after the line to resolve context.
7. Do not translate each cue in isolation.
8. If gender or number is unclear, prefer natural neutral Arabic wording that avoids gendered forms when possible.
9. Never change the meaning to avoid gender.
10. Keep character relationships consistent across the episode.
11. Pay special attention to commands, warnings, questions, and possessives.

Examples:

- If someone is addressing Rose: `Are you ready?` -> `هل أنتِ مستعدة؟`
- If someone is addressing the Doctor: `Are you ready?` -> `هل أنت مستعد؟`
- If the addressee is unclear, prefer a neutral rewrite when possible: `Are you ready?` -> `هل كل شيء جاهز؟`

## 11. Mechanical Fix Rules

If QA or validation fails because of a mechanical issue, fix only the mechanical issue. Mechanical issues include:

- numbering
- timestamp format
- empty cue
- orphan dialogue dash
- missing final newline
- filename mismatch
- mapping typo during Phase 2

Do not retranslate an episode for a mechanical fix unless the user explicitly asks.

## 12. No Full Diff Rule

- Never print full SRT diffs in final output.
- Use cue counts, validation summaries, and short examples instead.
- For workflow-only edits, a limited workflow diff is allowed when explicitly requested.
