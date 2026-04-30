# Subtitle Audit

Last audit date: 2026-04-30

## Current Production Summary

- Total Arabic subtitles in production: 220
- Status summary:
  - verified: 199
  - minor_offset: 20
  - manual_review: 1
- Encoding status: production Arabic subtitles were normalized to readable UTF-8, with BOM preserved where needed for compatibility

## Known Fixed Issues

- Arabic UTF-8 and BOM cleanup completed for production subtitle files
- Series 7 displaced subtitle chain was identified and remapped to the correct episodes
- The Time of the Doctor replacement and sync work was documented; the subtitle remains visible but still carries a manual-review status
- The Lazarus Experiment was checked and remains confirmed as the correct episode subtitle with acceptable sync
- The Christmas Invasion and The Runaway Bride both reflect stored drift fixes in the current audit history

## Remaining Manual Review Items

- `S07E31 The Time of the Doctor (Special)` remains `manual_review` in current subtitle status metadata
- Legacy non-production review files remain under `review/arabic-subtitles/` for historical investigation and should not be re-added to `ar/` without a new audit

## Focused Special Audit Notes

- The Christmas Invasion: verified in current status metadata, with prior drift fix recorded
- The Runaway Bride: verified in current status metadata, with prior drift fix recorded
- The Day of the Doctor: verified in current status metadata, with prior drift fix recorded
- The Star Beast: verified in current status metadata, with prior constant-offset fix recorded
- The Time of the Doctor: still manual review

## Reporting Issues

Users should report subtitle issues through:

- `/report` on the addon homepage
- GitHub issue template: `.github/ISSUE_TEMPLATE/subtitle-issue.md`

Requested report fields:

- Season
- Episode
- Episode title
- Subtitle language
- Problem type
- Approximate timestamp
- Device
- Stream quality used: 1080p or 480p
