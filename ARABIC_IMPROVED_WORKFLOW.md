# Arabic Improved Subtitle Workflow

## 1. Project goal

Arabic Improved is a professional Arabic subtitle track built from the English subtitles. It should provide clean viewer subtitles, not SDH/closed captions, and improve translation quality while preserving the original timing.

## 2. Current status

Last completed episode: S05E02 The Beast Below
Next target episode: S05E03 Victory of the Daleks
Completed Arabic Improved count: 67
Date: 2026-06-23

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

## 7. Character / Addressee Context Rules

- Before translating, identify the main speakers and addressees for the target episode from nearby cues.
- Use this to fix Arabic gender/number.
- Do not guess "you/your" randomly.
- Use a small context window around each cue, normally 5 cues before and 5 cues after, only when needed.
- Do not read unrelated episodes for context.

## 8. Forbidden Translation Mistakes

- Do not skip short spoken lines.
- Do not summarize dialogue.
- Do not remove spoken words because they look unimportant.
- Do not convert male addressee to feminine or female addressee to masculine.
- Do not leave unexplained English except names/approved terms.
- Do not make Arabic overly formal or awkward.
- Do not use old Arabic subtitles as a reference.

## 9. Doctor Who terminology

- Doctor = `الدكتور`
- TARDIS = `التارديس`
- sonic screwdriver = `المفك الصوتي`
- Dalek = `داليك`
- Time Lord = `سيد الزمن`
- Earth = `الأرض`
- aliens = `كائنات فضائية`
- Rose = `روز`

## 10. Bracketed/non-speech handling policy

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

## 11. Required final report format

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

## 12. Episode completion update

After finishing an episode, update this file minimally:

- Last completed episode = completed episode
- Next target episode = next missing episode
- Completed Arabic Improved count = updated count
- Add completed episode under Already completed if not already listed

Do not rewrite the whole file unnecessarily.

## 13. Standard command to continue

Use this reusable prompt to continue the next missing Arabic Improved episode:

```text
"Continue the next missing Arabic Improved episode using ARABIC_IMPROVED_WORKFLOW.md.
Work on ONE episode only.
Do not rush.
Use the target English SRT from .subtitle-audit-cache/english/.
Use GPT-5.5 for the whole workflow.
Do not ask the user to switch models.
Preserve spoken dialogue.
Remove only non-speech captions according to the workflow.
After creating a new Arabic Improved subtitle, it should become the preferred Arabic track for that episode.
Old Arabic remains backup.
Run npm run validate:improved-arabic and npm run check.
Update this workflow after finishing.
Return a short final report only."
```

## 14. Validation commands

Run both commands after finishing an episode:

```bash
npm run validate:improved-arabic
npm run check
```

## 15. Token Saving + Single-Model Rules

### Rule 1 — One episode only

Every translation pass must work on **one episode only**.
Never start another episode in the same pass.

---

### Rule 2 — Strict file scope

For each episode, inspect **only**:

- the target episode English SRT from `.subtitle-audit-cache/english/`
- the target `ar-improved/*.srt` file if it exists
- `arabicImprovedSubtitles.json`
- validation scripts only when needed

**Do not inspect** unrelated episodes, old Arabic subtitles, Arabic Alt, stream metadata, audit files, README, or `index.js` during translation.
`.subtitle-audit-cache/english/` is allowed only for the target episode English SRT. Other audit files/reports remain forbidden. Do not inspect English SRT files for unrelated episodes.

---

### Rule 3 — English-only source

Use the local English SRT as the **only** translation source.
Do not use old Arabic subtitles as a reference unless explicitly requested.

---

### Rule 4 — Single-model workflow

Use **GPT-5.5** for the whole Arabic Improved episode workflow.

- Use the same model for translation, cleanup, validation, mapping, and final report.
- Do not ask the user to switch models.
- Do not split the workflow into model-specific phases or specialist agents.

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
Use GPT-5.5 for everything.
Use the target English SRT from .subtitle-audit-cache/english/.
Follow the workflow.
Inspect only required files.
Do not inspect unrelated episodes, old Arabic, or Arabic Alt.
Do not print full SRT diffs.
Remove only non-speech captions after translation.
After creating a new Arabic Improved subtitle, it should become the preferred Arabic track for that episode.
Old Arabic remains backup.
Run npm run validate:improved-arabic and npm run check.
Update this workflow after finishing.
Return only the final report."
```

## 16. Pronoun / Gender Accuracy Rules

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
