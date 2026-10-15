# Vulgar/sexual warning validation

## Results

- `npm run check`: **passed**, no failures or warnings.
- `git diff --check`: **passed**.
- Audit coverage: **280 playable entries**.
- Detailed warning entries: **204** (163 Doctor Who, 40 Torchwood, 1 movie).
- Library rendering: all 204 entries found in the generated HTML, with English-only, left-to-right bracketed warning blocks after the English summaries.
- Empty sections: hidden; no empty term elements. The library contains 204 word sections and one confirmed action section.
- Runtime Stremio metadata comparison against the pre-formatting version: all 280 episode metadata entries (including unavailable Torchwood S01E02) and the movie were checked. Only the existing warning suffixes are reformatted; original summaries and all other metadata fields match the baseline.
- Runtime stream/subtitle comparison: **562 identical response objects**, covering every Doctor Who episode, every Torchwood entry including unavailable S01E02, and the movie.

The combined stream/subtitle JSON response snapshot has the same SHA-256 digest before and after:

```text
86c3a020468c540a47896bc5d24c59700c8dd2a3fd91cc4770933642fcf12ac3
```

The comparison includes stream descriptions, URLs, option order, attached subtitles, and standalone subtitle-track responses. Existing media handlers, tag-line helpers, subtitle files, and stream configuration were not edited.

## Ongoing checks

`tools/validateVulgarWarnings.js` is part of `npm run check`. It verifies:

- Complete playable-entry coverage and absence of warnings for unknown entries.
- Exact agreement between displayed terms and audited word/action evidence.
- Deduplication before and after English translation, hidden empty sections, and source diacritic/case normalization.
- English-only `[Vulgar words: ...]` and `[Sexual actions: ...]` blocks after the unchanged summary, with HTML paragraph breaks and a newline-collapse-safe bracketed metadata format.
- Explicit `sex`, `sexual`, and `sexy` examples.
- Reviewed species, rod, proper-name, and literal-curse exclusions.
- Exact playable clean-cut English sources and published Torchwood Arabic paths.
- Source SHA-256 digests and cue/timestamp/term references whenever the local source corpus is present.

The production presentation reads only `vulgarWarnings.json`. English audit-cache/source files are needed to rebuild and fully recheck evidence locally, rather than to render warnings.

See [the changed-entry report](vulgar-warning-changes.md) for the action-evidence limitations and [the evidence snapshot](vulgar-warning-evidence.json) for source-level references.
