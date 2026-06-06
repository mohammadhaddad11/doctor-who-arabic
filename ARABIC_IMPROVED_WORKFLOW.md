# Arabic Improved Subtitle Workflow

## 1. Project goal

Arabic Improved is a professional Arabic subtitle track built from the English subtitles. It should provide clean viewer subtitles, not SDH/closed captions, and improve translation quality while preserving the original timing.

## 2. Current status

Last completed episode: S03E01 Smith and Jones
Next target episode: S03E02 The Shakespeare Code
Completed Arabic Improved count: 30
Date: 2026-06-06

Already completed:
- S02E13 Doomsday
- S02E14 The Runaway Bride Special
- S03E01 Smith and Jones

## 3. Arabic Improved Priority Rule

- For episodes that already have Arabic Improved, Arabic Improved should be treated as the primary Arabic subtitle track.
- The old Arabic subtitle remains as backup/fallback.
- For episodes without Arabic Improved, the old Arabic subtitle remains the normal Arabic track.
- This priority applies episode-by-episode as work progresses, not only after the whole season is finished.
- Do not remove old Arabic subtitles.
- Do not rename/delete Arabic Alt.
- Each newly completed Arabic Improved episode should become the preferred Arabic track for that episode.

## 4. Main rule

Work on **ONE episode only** per pass.

Do not translate more than one episode in the same pass, even if the next episode looks straightforward.

## 5. Workflow per episode

### PHASE 1: Translate from English

- Use the English SRT as the source.
- Preserve cue order.
- Preserve timestamps.
- Translate every spoken line.
- Do not delete cues during translation.
- Do not merge or split cues.
- Do not summarize.

### PHASE 2: Clean non-speech captions

- Remove standalone non-speech captions only.
- If a cue has both non-speech and dialogue, remove only the non-speech part and keep the dialogue.
- Renumber cues after removing standalone non-speech cues.
- Never remove spoken dialogue.

## 6. Translation style guide

- Use professional Modern Standard Arabic.
- Keep the subtitles natural, cinematic, and watchable.
- Do not translate too literally when it harms meaning or flow.
- Preserve tone and humor.
- Keep lines readable.
- Avoid broken Arabic, awkward phrasing, spelling errors, and malformed punctuation.
- Do not leave unexplained English except for names or approved terms.

## 7. Doctor Who terminology

- Doctor = `الدكتور`
- TARDIS = `التارديس`
- sonic screwdriver = `المفك الصوتي`
- Dalek = `داليك`
- Time Lord = `سيد الزمن`
- Earth = `الأرض`
- aliens = `كائنات فضائية`
- Rose = `روز`

## 8. Bracketed/non-speech handling policy

### A) Removed standalone

Standalone non-speech captions should be removed entirely.

Example:

```text
English: (footsteps)
Arabic decision: remove cue entirely
```

### B) Removed inline but kept dialogue

If a cue contains both non-speech information and dialogue, remove only the non-speech part and keep the dialogue.

Example:

```text
English:
(door opens)
What was that?

Final Arabic:
ما كان ذلك؟
```

### C) Kept/converted important context

Only keep non-speech context if it is necessary to understand the scene and cannot be inferred visually.

Example:

```text
English:
(over speaker) Evacuate immediately.

Final Arabic:
عبر مكبر الصوت: أخلوا المكان فورًا.
```

## 9. Required final report format

Each episode report must include:

```text
episode translated:
source cue count:
final cue count:
number of non-speech-only cues removed:
confirmation spoken dialogue preserved:
validation result:
suggested Stremio test timestamps:

Pronoun/gender QA:
- checked yes/no:
- ambiguous "you" lines reviewed:
- examples fixed:
  1. timestamp:
     English:
     Final Arabic:
     reason:

Bracketed/non-speech handling examples:
1. Removed standalone:
   timestamp:
   English:
   Arabic decision:

2. Removed inline but kept dialogue:
   timestamp:
   English:
   Final Arabic:

3. Kept/converted important context:
   timestamp:
   English:
   Final Arabic:

files changed:
exact git add/commit/push commands:
```

## 10. Standard command to continue

Use this reusable prompt to continue the next missing Arabic Improved episode:

```text
"Continue the next missing Arabic Improved episode using ARABIC_IMPROVED_WORKFLOW.md.
Work on ONE episode only.
Do not rush.
Preserve spoken dialogue.
Remove only non-speech captions according to the workflow.
After creating a new Arabic Improved subtitle, it should become the preferred Arabic track for that episode.
Old Arabic remains backup.
Run npm run validate:improved-arabic and npm run check.
Return the required final report format from the workflow."
```

## 11. Validation commands

Run both commands after finishing an episode:

```bash
npm run validate:improved-arabic
npm run check
```

## 12. Credit / Token Saving + Model Routing Rules

### Rule 1 — One episode only

Every translation pass must work on **one episode only**.
Never start another episode in the same pass.

---

### Rule 2 — Strict file scope

For each episode, inspect **only**:

- the English source subtitle for the target episode
- the target `ar-improved/*.srt` file if it exists
- `arabicImprovedSubtitles.json`
- validation scripts only when needed

**Do not inspect** unrelated episodes, old Arabic subtitles, Arabic Alt, stream metadata, audit files, README, or `index.js` during translation.

---

### Rule 3 — English-only source

Use the local English SRT as the **only** translation source.
Do not use old Arabic subtitles as a reference unless explicitly requested.

---

### Rule 4 — Model routing

Use the **strong translation model** only for:

- translating spoken dialogue
- improving Arabic phrasing
- fixing meaning/quality issues

Use the **cheaper/code model** for:

- locating files
- creating files
- updating `arabicImprovedSubtitles.json`
- removing standalone non-speech cues after translation
- renumbering SRT cues
- running validation
- fixing SRT formatting
- git status and commit instructions

If OpenCode supports agent rules, create/use:

- **translator agent**: strongest model, translation quality only
- **mechanic agent**: cheaper/code model, file operations and validation only

---

### Rule 5 — No pre-clean phase for now

Do not pre-clean the English subtitle before translation.
Translate first, then remove non-speech captions after translation.
This avoids accidentally removing spoken dialogue.

---

### Rule 6 — No full subtitle diffs

Never print the full SRT diff in final output.
Use only:

- `git diff --stat`
- cue counts
- validation summary
- 3 bracket/non-speech examples

---

### Rule 7 — Formatting fixes do not need retranslation

If validation fails because of:

- numbering
- timestamp format
- empty cue
- mapping typo
- missing file

Fix **only** the mechanical issue.
Do **not** retranslate the episode.

---

### Rule 8 — Final report must be short

Use only this format:

```text
episode:
source cues:
final cues:
removed non-speech:
spoken dialogue preserved:
validation:
suggested Stremio test timestamps:

Pronoun/gender QA:
- checked yes/no:
- ambiguous "you" lines reviewed:
- examples fixed:
  1. timestamp:
     English:
     Final Arabic:
     reason:

Bracketed/non-speech handling examples:
1. Removed standalone:
   timestamp:
   English:
   Arabic decision:

2. Removed inline but kept dialogue:
   timestamp:
   English:
   Final Arabic:

3. Kept/converted important context:
   timestamp:
   English:
   Final Arabic:

files changed:
commit commands:
```

---

### Rule 9 — Reusable continue command

```text
"Continue the next missing Arabic Improved episode using ARABIC_IMPROVED_WORKFLOW.md.
Work on ONE episode only.
Use token-saving and model-routing rules.
Use the local English SRT only.
Inspect only required files.
Do not print full SRT diffs.
Translate all spoken dialogue with the strongest translation model.
Use the cheaper/code model for mechanical cleanup, validation, mapping, and git instructions.
Remove only non-speech captions after translation.
After creating a new Arabic Improved subtitle, it should become the preferred Arabic track for that episode.
Old Arabic remains backup.
Run npm run validate:improved-arabic and npm run check.
Return only the required final report."
```

## 13. Pronoun / Gender Accuracy Rules

English pronouns are often ambiguous, especially "you", "your", and "yourself".
Arabic Improved must not guess randomly.

For every episode, after translation and before final validation, run a dedicated pronoun/gender review pass:

1. Identify speaker and addressee from context.
2. For every ambiguous English "you":
   - if the addressee is male singular, use masculine Arabic forms.
   - if the addressee is female singular, use feminine Arabic forms.
   - if the addressee is plural/group, use plural Arabic forms.
3. Use nearby cues before and after the line to resolve context.
4. Do not translate each cue in isolation.
5. If gender/number is unclear, prefer natural neutral Arabic wording that avoids gendered forms when possible.
6. Never change the meaning to avoid gender.
7. Keep character relationships consistent across the episode.
8. Pay special attention to:
   - Doctor speaking to Rose
   - Rose speaking to the Doctor
   - people speaking to Jackie
   - people speaking to Mickey
   - groups being addressed
   - commands and warnings

Examples:
- If someone is addressing Rose:
  "Are you ready?" -> "هل أنتِ مستعدة؟"
- If someone is addressing the Doctor:
  "Are you ready?" -> "هل أنت مستعد؟"
- If the addressee is unclear:
  prefer a neutral rewrite when possible:
  "Are you ready?" -> "هل كل شيء جاهز؟"
