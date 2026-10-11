# Torchwood Dedicated Clean-Cut Integration

Generated: 2026-10-10T22:30:29.964192+00:00

## Result

All nine clean-cut HQ and 480p streams now use dedicated Archive items. Seven verified custom 1080p encodes are exposed between HQ and 480p, for 25 production variants. No shared `torchwood-clean` video URL is visible. S01E10 has exactly two variants.

The earlier audit observed bandwidth-limited routes; those historical samples are not fresh post-processing delivery measurements. S02E09 and S02E11 custom 1080p publication decisions now use completed-file metadata, current bounded header probes and unchanged timeline-safe file identities. Their old processing-time delivery results are superseded. No new delivery benchmark was performed.

## Verified inventory

| Episode | Dedicated item | HQ | Published custom 1080p | 480p |
|---|---|---|---|---|
| S01E10 | s-01-e-10_202610 | S01E10.clean.final.mp4 | NO | S01E10.clean.final.ia.mp4 |
| S01E13 | s-01-e-13_202610 | S01E13.clean.final.mp4 | S01E13.clean.stream1080.mp4 | S01E13.clean.final.ia.mp4 |
| S02E03 | s-02-e-03_202610 | S02E03.clean.final.mp4 | S02E03.clean.stream1080.mp4 | S02E03.clean.final.ia.mp4 |
| S02E05 | s-02-e-05_202610 | S02E05.clean.final.mp4 | S02E05.clean.stream1080.mp4 | S02E05.clean.final.ia.mp4 |
| S02E09 | s-02-e-09_202610 | S02E09.clean.final.mp4 | S02E09.clean.stream1080.mp4 | S02E09.clean.final.ia.mp4 |
| S02E11 | s-02-e-11_202610 | S02E11.clean.final.mp4 | S02E11.clean.stream1080.mp4 | S02E11.clean.final.ia.mp4 |
| S02E12 | s-02-e-12_202610 | S02E12.clean.final.mp4 | S02E12.clean.stream1080.mp4 | S02E12.clean.final.ia.mp4 |
| S04E03 | s-04-e-03_202610 | S04E03.clean.final.mp4 | S04E03.clean.stream1080.mp4 | S04E03.clean.final.ia.mp4 |
| S04E07 | s-04-e-07_202610 | S04E07.clean.final.mp4 | NO | S04E07.clean.final.ia.mp4 |

## Timeline evidence

All nine dedicated HQ files match old authoritative HQ size, MD5 and SHA-1. Remote/local 64 KiB samples at beginning, 96 MiB and end also match.

All eight custom encodes have exactly matching video duration, start and 25 fps. Five short visual anchors (beginning, 25%, 50%, 75%, ending) and two subtitle-time audio anchors passed, with zero measured audio offset. Three remote/local byte samples identify the local custom render as the uploaded encode. Container differences are only AAC tail padding.

All nine chosen 480p files are explicit Archive derivatives of the identical final HQ. Video start, duration and fps match; only audio/container tail rounding differs. No SRT or media file was altered.

## All video candidates

The CSV records every actual new video file, properties, size, checksums, source relation, canonical URL and publication status. Extra `.clean.stream1080.ia.mp4` files are redundant 480p derivatives, not custom 1080p encodes.

## Aggregate performance

Each potential production candidate was tested through canonical public URLs with HEAD and three initial/later 4 MiB pairs. Weak candidates received additional sequential repeats. Measurements below include every completed successful sample. Redundant generated derivatives received a single bounded property probe and were not selected.

This section describes the original audit. S02E09/S02E11 custom-encode processing-time results have been removed from the current summary below; raw historical observations remain in JSON but do not justify withholding either now-complete file. No post-processing throughput claim is made.

| Episode | Variant/file | Required Mbps | Median Mbps | Headroom | Classification | Published |
|---|---|---:|---:|---:|---|---|
| S01E10 | S01E10.clean.final.ia.mp4 | 0.78863 | 20.77945 | 26.349 | EXCELLENT | YES |
| S01E10 | S01E10.clean.final.mp4 | 4.3031 | 21.9148 | 5.093 | EXCELLENT | YES |
| S01E13 | S01E13.clean.final.ia.mp4 | 0.7994 | 13.0698 | 16.35 | GOOD | YES |
| S01E13 | S01E13.clean.final.mp4 | 4.93112 | 19.6644 | 3.988 | EXCELLENT | YES |
| S01E13 | S01E13.clean.stream1080.mp4 | 1.99509 | 8.83725 | 4.429 | GOOD | YES |
| S02E03 | S02E03.clean.final.ia.mp4 | 0.79617 | 16.5541 | 20.792 | EXCELLENT | YES |
| S02E03 | S02E03.clean.final.mp4 | 7.25482 | 11.65445 | 1.606 | MARGINAL | YES |
| S02E03 | S02E03.clean.stream1080.mp4 | 2.01433 | 3.99395 | 1.983 | MARGINAL | YES |
| S02E05 | S02E05.clean.final.ia.mp4 | 0.79483 | 21.95925 | 27.628 | EXCELLENT | YES |
| S02E05 | S02E05.clean.final.mp4 | 5.14482 | 21.11485 | 4.104 | EXCELLENT | YES |
| S02E05 | S02E05.clean.stream1080.mp4 | 2.00794 | 19.1909 | 9.558 | EXCELLENT | YES |
| S02E09 | S02E09.clean.final.mp4 | 6.15642 | 1.17475 | 0.191 | INSUFFICIENT | YES |
| S02E09 | S02E09.clean.stream1080.mp4 | 2.00643 | — | — | NOT REBENCHMARKED; processing result superseded | YES |
| S02E09 | S02E09.clean.final.ia.mp4 (old shared) | 0.79372 | 1.1347 | 1.43 | MARGINAL | NO |
| S02E11 | S02E11.clean.final.mp4 | 4.70885 | 13.37585 | 2.841 | GOOD | YES |
| S02E11 | S02E11.clean.stream1080.mp4 | 2.00415 | — | — | NOT REBENCHMARKED; processing result superseded | YES |
| S02E11 | S02E11.clean.final.ia.mp4 (old shared) | 0.78844 | 0.952 | 1.207 | MARGINAL | NO |
| S02E12 | S02E12.clean.final.ia.mp4 | 0.79874 | 20.24235 | 25.343 | EXCELLENT | YES |
| S02E12 | S02E12.clean.final.mp4 | 7.44545 | 6.3012 | 0.846 | INSUFFICIENT | YES |
| S02E12 | S02E12.clean.stream1080.mp4 | 2.00338 | 5.89235 | 2.941 | GOOD | YES |
| S04E03 | S04E03.clean.final.ia.mp4 | 0.79153 | 5.5851 | 7.056 | GOOD | YES |
| S04E03 | S04E03.clean.final.mp4 | 2.74327 | 2.7166 | 0.99 | INSUFFICIENT | YES |
| S04E03 | S04E03.clean.stream1080.mp4 | 1.9611 | 2.43405 | 1.241 | MARGINAL | YES |
| S04E07 | S04E07.clean.final.ia.mp4 | 0.79682 | 1.6795 | 2.108 | GOOD | YES |
| S04E07 | S04E07.clean.final.mp4 | 2.45152 | 1.5416 | 0.629 | INSUFFICIENT | YES |
| S04E07 | S04E07.clean.stream1080.mp4 | 1.84732 | 1.81675 | 0.983 | INSUFFICIENT | NO |
| S02E09 | S02E09.clean.final.ia.mp4 | 0.79372 | 1.3589 | 1.712 | MARGINAL | YES |
| S02E11 | S02E11.clean.final.ia.mp4 | 0.78844 | 1.3816 | 1.752 | MARGINAL | YES |

Excellent: >15 Mbps and >=3x requirement; Good: >=2x; Marginal: >=1x; Insufficient: <1x. Marginal delivery may still buffer. These are snapshots, not sustained-playback guarantees.

## Final stream order

### S01E10
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-01-e-10_202610/S01E10.clean.final.mp4
2. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-01-e-10_202610/S01E10.clean.final.ia.mp4

### S01E13
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-01-e-13_202610/S01E13.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-01-e-13_202610/S01E13.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-01-e-13_202610/S01E13.clean.final.ia.mp4

### S02E03
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-02-e-03_202610/S02E03.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-02-e-03_202610/S02E03.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-02-e-03_202610/S02E03.clean.final.ia.mp4

### S02E05
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-02-e-05_202610/S02E05.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-02-e-05_202610/S02E05.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-02-e-05_202610/S02E05.clean.final.ia.mp4

### S02E09
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-02-e-09_202610/S02E09.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-02-e-09_202610/S02E09.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-02-e-09_202610/S02E09.clean.final.ia.mp4

### S02E11
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-02-e-11_202610/S02E11.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-02-e-11_202610/S02E11.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-02-e-11_202610/S02E11.clean.final.ia.mp4

### S02E12
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-02-e-12_202610/S02E12.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-02-e-12_202610/S02E12.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-02-e-12_202610/S02E12.clean.final.ia.mp4

### S04E03
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-04-e-03_202610/S04E03.clean.final.mp4
2. Torchwood Clean Cut • 1080p Speed — https://archive.org/download/s-04-e-03_202610/S04E03.clean.stream1080.mp4
3. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-04-e-03_202610/S04E03.clean.final.ia.mp4

### S04E07
1. Torchwood Clean Cut • 1080p HQ — https://archive.org/download/s-04-e-07_202610/S04E07.clean.final.mp4
2. Torchwood Clean Cut • 480p Speed — https://archive.org/download/s-04-e-07_202610/S04E07.clean.final.ia.mp4

## Sources withheld

- S01E13 `S01E13.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S02E03 `S02E03.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S02E05 `S02E05.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S02E09 `S02E09.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S02E11 `S02E11.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S02E12 `S02E12.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S04E03 `S04E03.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.
- S04E07 `S04E07.clean.stream1080.mp4`: Below sustainable playback requirement/headroom across combined repeated tests.
- S04E07 `S04E07.clean.stream1080.ia.mp4`: Redundant generated 480p derivative of the custom encode; HQ-derived 480p chosen instead.

## Old mappings removed

- S01E10: https://archive.org/download/torchwood-clean/S01E10.clean.final.mp4
- S01E10: https://archive.org/download/torchwood-clean/S01E10.clean.final.ia.mp4
- S01E13: https://archive.org/download/torchwood-clean/S01E13.clean.final.mp4
- S01E13: https://archive.org/download/torchwood-clean/S01E13.clean.final.ia.mp4
- S02E03: https://archive.org/download/torchwood-clean/S02E03.clean.final.mp4
- S02E03: https://archive.org/download/torchwood-clean/S02E03.clean.final.ia.mp4
- S02E05: https://archive.org/download/torchwood-clean/S02E05.clean.final.mp4
- S02E05: https://archive.org/download/torchwood-clean/S02E05.clean.final.ia.mp4
- S02E09: https://archive.org/download/torchwood-clean/S02E09.clean.final.mp4
- S02E09: https://archive.org/download/torchwood-clean/S02E09.clean.final.ia.mp4
- S02E11: https://archive.org/download/torchwood-clean/S02E11.clean.final.mp4
- S02E11: https://archive.org/download/torchwood-clean/S02E11.clean.final.ia.mp4
- S02E12: https://archive.org/download/torchwood-clean/S02E12.clean.final.mp4
- S02E12: https://archive.org/download/torchwood-clean/S02E12.clean.final.ia.mp4
- S04E03: https://archive.org/download/torchwood-clean/S04E03.clean.final.mp4
- S04E03: https://archive.org/download/torchwood-clean/S04E03.clean.final.ia.mp4
- S04E07: https://archive.org/download/torchwood-clean/S04E07.clean.final.mp4
- S04E07: https://archive.org/download/torchwood-clean/S04E07.clean.final.ia.mp4

## Validation

- `npm run check`: passed with zero failures or warnings.
- `git diff --check`: passed.

Original addon-response check: 9 episodes, 23 streams, 0 failures. Post-processing update: actual HTTP responses for S02E09 and S02E11 were checked and match the updated JSON audit, with three variants each and zero failures, bringing the clean-cut production total to 25. HQ first; custom 1080p second when configured; 480p last; no duplicate URLs; canonical URLs only; Arabic first and English second; every variant shares the unchanged clean subtitle tracks. Other episode mappings and subtitle contents are unchanged. No commit or push performed.
