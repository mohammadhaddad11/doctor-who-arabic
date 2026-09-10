# Torchwood Arabic Subtitle Workflow

## Status And Scope

Torchwood Arabic subtitles are planned for a later phase. This document defines the workflow but does not make any Arabic subtitle available in the addon.

- Work episode by episode, never as an unreviewed whole-series bulk translation.
- Do not map, advertise, or expose a subtitle until its translation, moderation, timing, and player review are complete.
- S01E02 is listed for continuity only and has no playable stream, so it must not receive a production subtitle mapping.
- Keep episode IDs, stream URLs, edit/version suffixes, and season numbering unchanged.

## Relationship To The Doctor Who Workflow

`ARABIC_IMPROVED_WORKFLOW.md` remains the authority for the Doctor Who glossary and the general Arabic quality rules. Torchwood may reuse its guidance for Modern Standard Arabic, names, Whoniverse terminology, timing preservation, non-speech cues, and staged review.

Torchwood requires a stricter mature-language pass because it contains more adult dialogue. Moderation must soften vulgar or overly explicit wording without removing plot facts, relationship context, consent, coercion, danger, characterization, or emotional force.

## Source Selection

1. Confirm the exact playable stream and canonical `SxxExx` episode ID.
2. Use a synchronized English subtitle as the only translation source.
3. For an original MKV, verify that the English source matches that exact original stream.
4. For a clean-cut episode, use the matching file from `torchwood-subtitles/en-clean/`. Never use uncut timings for a clean edit.
5. Preserve meaningful edit/version suffixes such as `v2`; do not assume similarly named files share timing.
6. Record the English source filename and stream identity in the episode review notes.

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

Until then, public metadata must continue to state that Torchwood Arabic subtitles are planned later.
