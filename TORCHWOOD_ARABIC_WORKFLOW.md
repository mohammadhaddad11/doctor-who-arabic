# Torchwood Arabic Subtitle Workflow

## Status And Scope

Torchwood Arabic subtitles have been completed for every playable episode and integrated into the addon. Staging remains the reviewed source archive for the published production files.

- Work episode by episode, never as an unreviewed whole-series bulk translation.
- Do not map, advertise, or expose a subtitle until its translation, moderation, timing, and player review are complete.
- S01E02 is listed for continuity only and has no playable stream, so it must not receive a production subtitle mapping.
- Keep episode IDs, stream URLs, edit/version suffixes, and season numbering unchanged.

## Current Translation Status

This section is the source of truth for Torchwood Arabic translation and publication progress. An episode listed as completed has a complete, validated Arabic subtitle in `torchwood-subtitles/ar-staging/`; publication status is recorded separately below.

Last completed batch:
- S04E09 The Gathering
- S04E10 The Blood Line

Completed Arabic episode count: 40

Already completed:
- S01E01 Everything Changes
- S01E03 Ghost Machine
- S01E04 Cyberwoman
- S01E05 Small Worlds
- S01E06 Countrycide
- S01E07 Greeks Bearing Gifts
- S01E08 They Keep Killing Suzie
- S01E09 Random Shoes
- S01E10 Out of Time
- S01E11 Combat
- S01E12 Captain Jack Harkness
- S01E13 End of Days
- S02E01 Kiss Kiss, Bang Bang
- S02E02 Sleeper
- S02E03 To the Last Man
- S02E04 Meat
- S02E05 Adam
- S02E06 Reset
- S02E07 Dead Man Walking
- S02E08 A Day in the Death
- S02E09 Something Borrowed
- S02E10 From Out of the Rain
- S02E11 Adrift
- S02E12 Fragments
- S02E13 Exit Wounds
- S03E01 Day One
- S03E02 Day Two
- S03E03 Day Three
- S03E04 Day Four
- S03E05 Day Five
- S04E01 The New World
- S04E02 Rendition
- S04E03 Dead of Night
- S04E04 Escape to L.A.
- S04E05 The Categories of Life
- S04E06 The Middle Men
- S04E07 Immortal Sins
- S04E08 End of the Road
- S04E09 The Gathering
- S04E10 The Blood Line

Skipped / unavailable:
- S01E02 Day One - no playable stream; never select as a translation target

Next translation batch:
- None - all 40 playable episodes are complete

## Publication Status

Published/integrated Arabic episode count: 40

- All 40 completed playable episodes are mapped to production Arabic subtitles and exposed through both Torchwood stream subtitle tracks and the subtitles resource.
- The 31 original-stream episodes use their existing original MKV streams and production subtitles from `torchwood-subtitles/ar-improved/`.
- Original-stream episode IDs: S01E01, S01E03-S01E09, S01E11-S01E12, S02E01-S02E02, S02E04, S02E06-S02E08, S02E10, S02E13, S03E01-S03E05, S04E01-S04E02, S04E04-S04E06, S04E08-S04E10.
- The 9 clean-cut episodes use matching production subtitles from `torchwood-subtitles/ar-clean/`.
- Clean-cut episode IDs: S01E10, S01E13, S02E03, S02E05, S02E09, S02E11, S02E12, S04E03, S04E07.
- The authoritative clean-cut media source is `https://archive.org/details/torchwood-clean`; production uses each episode's direct `.clean.final.mp4` file URL, never the item page or generated `.ia.mp4` derivative.
- Completed episodes intentionally left staged-only: none.
- Skipped/unavailable: S01E02 Day One, which has no playable stream and no Arabic production mapping.
- Remaining untranslated playable episodes: none.

### Translation Status Update Rules

- Before selecting work, inspect the existing Torchwood Arabic subtitle files and count only genuinely complete, validated episodes. Resume a partial file instead of marking it complete or restarting it.
- `Next translation batch` must list exactly two playable untranslated episodes in canonical order whenever at least two are available.
- Process the two episodes sequentially and keep translation output in `torchwood-subtitles/ar-staging/`.
- Update this status only after both episodes in `Next translation batch` have been successfully translated and validated.
- After both succeed, replace `Last completed batch` with those two episodes, add both to `Already completed`, update `Completed Arabic episode count`, and select the next two playable untranslated episodes for `Next translation batch`.
- If either episode fails or remains incomplete, do not advance the batch and do not mark that episode as completed.
- Keep S01E02 under `Skipped / unavailable`; it must never appear in `Next translation batch`.
- Do not move staged subtitles into a served directory, modify production mappings, wire them into the addon, or advertise them during translation. Integration remains a separate task.

## Relationship To The Doctor Who Workflow

`ARABIC_IMPROVED_WORKFLOW.md` remains the authority for the Doctor Who glossary and the general Arabic quality rules. Torchwood may reuse its guidance for Modern Standard Arabic, names, Whoniverse terminology, timing preservation, non-speech cues, and staged review.

Torchwood requires a stricter mature-language pass because it contains more adult dialogue. Moderation must soften vulgar or overly explicit wording without removing plot facts, relationship context, consent, coercion, danger, characterization, or emotional force.

## Source Selection

1. Confirm the exact playable stream and canonical `SxxExx` episode ID.
2. Prefer an existing synchronized text English subtitle that matches the exact playable stream, and use it as the only translation source.
3. For an original MKV, verify that the English source matches that exact original stream. A text subtitle track such as SRT or ASS embedded in the exact MKV may be extracted and used.
4. If the embedded subtitle is PGS or otherwise image-based, do not OCR or convert it. Find a reliable matching text English SRT and verify its timing against the exact stream instead.
5. For a clean-cut episode, use the matching file from `torchwood-subtitles/en-clean/`. Never use uncut timings for a clean edit.
6. Preserve meaningful edit/version suffixes such as `v2`; do not assume similarly named files share timing.
7. Record the English source filename and stream identity in the episode review notes.
8. Translate directly into Arabic. Do not use Google Translate, MyMemory, LibreTranslate, or another external machine-translation API.

## Episode Workflow

1. Select one episode and verify its English source against the playable stream.
2. Create the Arabic subtitle in a staging location that is not served by the addon.
3. Translate into natural, concise Modern Standard Arabic while preserving dialogue meaning and cue timing.
4. Remove standalone non-speech captions only under the rules in `ARABIC_IMPROVED_WORKFLOW.md`; retain dialogue from mixed cues.
5. Apply the mature-language policy and review every flagged line in context.
6. Run `npm run validate:arabic-moderation` after each episode or small reviewed batch.
7. Manually review language, continuity, names, pronouns, timing, line breaks, and visual rendering in an actual player.
8. Wire the file only in a separate integration step after review is complete.
9. Run production and endpoint validation after integration.

Bulk machine translation of the full series is not an acceptable substitute for this process.

## Mature-Language Policy

- Preserve intent and emotional weight, but use clean, acceptable Arabic.
- Do not use direct vulgar Arabic equivalents.
- Render profanity with a clean contextual equivalent or omit redundant emphasis when meaning is preserved.
- Keep mature implications non-graphic.
- Avoid graphic anatomical wording unless medical, scientific, safety, or plot clarity genuinely requires it.
- Treat automated findings as review prompts; the validator cannot determine context or certify translation quality.
- Keep the configurable policy terms in `torchwoodArabicModeration.js` professional and narrowly scoped.

## Future Directory Policy

The moderation validator scans these future Arabic work locations recursively:

- `torchwood-subtitles/ar-staging/` (not served)
- `torchwood-subtitles/ar/`
- `torchwood-subtitles/ar-improved/`
- `torchwood-subtitles/ar-clean/`

These directories may remain absent until translation work begins. Zero files is a valid state and must be reported as such, not treated as a failure.

Staged or unreviewed subtitles must remain in `ar-staging/` and outside served production mappings. Creating a file does not make it available in Stremio.

## RTL Punctuation And BiDi Policy

Arabic is right-to-left, while Latin punctuation, English words, and numbers may be treated as neutral or left-to-right by the Unicode Bidirectional Algorithm. Subtitle renderers do not all resolve mixed-direction lines consistently, so a period may appear at the wrong visual edge even when the stored text order looks correct.

- Store Arabic in logical reading order; never reverse text manually.
- Prefer Arabic punctuation where applicable: Arabic comma `،`, Arabic question mark `؟`, and Arabic semicolon `؛`.
- Avoid unnecessary English punctuation and English words inside Arabic subtitle lines.
- Keep technical and Whoniverse terms consistent with the glossary in `ARABIC_IMPROVED_WORKFLOW.md`.
- Review mixed Arabic/English/numeric lines visually in an actual subtitle player.
- If neutral punctuation renders incorrectly, use Right-to-Left Mark (RLM, U+200F) carefully around the affected text.
- Example internal representation: `\u200Fهذا اختبار.\u200F`
- Do not overuse invisible marks.
- Do not use RTL override characters broadly unless an exceptional, documented player issue makes them unavoidable.
- The validator may warn when a mostly Arabic line ends in neutral ASCII punctuation without RLM. This is a review warning, not an automatic rewrite or release failure.
- Do not auto-fix BiDi marks or punctuation without an explicit reviewed task.

There is no separate Arabic full-stop character equivalent to `.` in normal Arabic typography. Full stops therefore require careful BiDi handling and player review rather than blind punctuation replacement.

## Validation And Manual Review

Run after every episode or small batch:

```bash
npm run validate:arabic-moderation
npm run check
npm run validate:improved-arabic
git diff --check
```

The moderation validator checks UTF-8, SRT structure, cue order, empty cues, policy terms, possible untranslated English profanity, line length, and likely BiDi punctuation issues. Warnings require human review even when the command exits successfully.

Manual review must confirm:

- The Arabic matches the exact playable edit.
- No dialogue or plot-critical meaning was lost during moderation.
- Names and Whoniverse terms follow the existing glossary.
- Timing and line breaks are readable.
- Mixed-direction punctuation renders correctly in a real player.
- The subtitle remains unavailable until it has been intentionally wired and validated.

## Integration Gate

An episode may be advertised as having Arabic subtitles only after all of these are true:

- The exact English source and playable stream were verified.
- Translation and moderation reviews were completed.
- Structural and moderation validators completed without failures.
- Warnings were reviewed and resolved or explicitly accepted.
- In-player timing and BiDi review passed.
- The production registry mapping was added and endpoint behavior was tested.

Public metadata may state that Arabic Improved subtitles are available only while all production mappings and validation checks continue to pass.
