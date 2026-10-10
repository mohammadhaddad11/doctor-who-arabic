# Torchwood Normal Production Stream Audit

Generated: 2026-10-10T04:01:25.257674+00:00

## Scope and method

Only the 31 normal playable episodes and 25 existing Speed options were tested: 56 media URLs. All already use canonical Archive `/download/` URLs. HEAD, bounded 4 MiB initial and 256 KiB later ranges, and lightweight probes were used. Flagged routes were repeated with 8 MiB and lower concurrency; persistently slow routes were compared with metadata-listed same-file mirrors using equal-sized initial and later ranges.

No clean-cut media requests, full downloads, full decodes, frame counts, whole-video hashes or re-encodes were performed. S01E02 was not touched. Clean-cut/unavailable objects were only compared before/after for preservation. Doctor Who mappings were not changed.

Healthy requires successful probe and ranges, TTFB <=5 seconds, and measured throughput >=1.25x average bitrate. This is a network snapshot, not a sustained-playback guarantee.

## Summary

First pass: 23 healthy HQ routes and 8 slow. After retries and controlled comparisons, before any production change: 29 healthy, 2 slow, 0 unreliable, 0 broken. After changes: identical media-route classifications, because all video URLs were preserved.

All 25 existing Speed options passed final checks. No route was consistently improved enough to justify a new hard-pinned backend. No Speed options were removed or added.

The six HQ-only episodes previously exposed Arabic externally and English only inside their MKV. Their existing English source files are now exposed externally after Arabic, without editing those files.

## Host comparison

| Backend reached | Options | Median TTFB s | Median Mbps | Healthy | Slow/unreliable/broken |
|---|---:|---:|---:|---:|---:|
| dn601204.us.archive.org | 1 | 1.529 | 5.401 | 1 | 0 |
| dn601209.us.archive.org | 1 | 1.588 | 2.209 | 1 | 0 |
| dn720300.ca.archive.org | 15 | 1.987 | 23.277 | 14 | 1 |
| dn720303.ca.archive.org | 18 | 2.268 | 22.992 | 18 | 0 |
| dn721608.ca.archive.org | 17 | 1.999 | 22.917 | 16 | 1 |
| dn800308.us.archive.org | 2 | 1.568 | 24.434 | 2 | 0 |
| dn801200.us.archive.org | 2 | 1.542 | 22.917 | 2 | 0 |

Host counts use final option classifications; medians use the latest initial-range observation for each option. Detailed paired results are in JSON.

## Remaining slow HQ routes

| Episode | Required Mbps | Equal-size public initial/later Mbps | Same-file mirror initial/later Mbps | Action |
|---|---:|---|---|---|
| S01E07 | 11.604 | 34.397 / 12.837 | 32.126 / 35.599 | Keep canonical HQ and healthy existing Speed; mirror not consistently >1.5x faster |
| S02E07 | 11.948 | 9.323 / 33.45 | 19.428 / 33.526 | Keep canonical HQ and healthy existing Speed; mirror not consistently >1.5x faster |

## Six HQ-only episodes

| Episode | HQ health | Speed added | Metadata duration difference | Reason |
|---|---|---|---:|---|
| S01E11 | HEALTHY | NO | -0.55 s | Timeline equivalence not confidently established cheaply; leave HQ-only |
| S03E02 | HEALTHY | NO | -0.34 s | Timeline equivalence not confidently established cheaply; leave HQ-only |
| S04E01 | HEALTHY | NO | -0.7 s | Timeline equivalence not confidently established cheaply; leave HQ-only |
| S04E04 | HEALTHY | NO | -0.12 s | Timeline equivalence not confidently established cheaply; leave HQ-only |
| S04E05 | HEALTHY | NO | -1.47 s | Timeline equivalence not confidently established cheaply; leave HQ-only |
| S04E09 | HEALTHY | NO | -0.89 s | Timeline equivalence not confidently established cheaply; leave HQ-only |

## Complete canonical normal inventory

| Episode | HQ URL | Speed URL | Final HQ health |
|---|---|---|---|
| S01E01 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x01%20Todo%20cambia%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x01%20Todo%20cambia%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E03 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x03%20La%20m%C3%A1quina%20de%20los%20fantasmas%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x03%20La%20m%C3%A1quina%20de%20los%20fantasmas%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E04 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x04%20La%20cibermujer%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x04%20La%20cibermujer%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E05 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x05%20Hadas%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x05%20Hadas%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E06 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x06%20Can%C3%ADbales%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x06%20Can%C3%ADbales%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E07 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x07%20Regalo%20envenenado%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x07%20Regalo%20envenenado%20%5BDual%5D%20%5B1080p%5D.mp4 | SLOW |
| S01E08 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x08%20Volver%20a%20matar%20a%20Suzie%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x08%20Volver%20a%20matar%20a%20Suzie%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E09 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x09%20Zapatos%20de%20desconocidos%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x09%20Zapatos%20de%20desconocidos%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S01E11 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x11%20El%20combate%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S01E12 | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x12%20Capit%C3%A1n%20Jack%20Harkness%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-1x-08-volver-a-matar-a-suzie-dual-1080p/Torchwood%201x12%20Capit%C3%A1n%20Jack%20Harkness%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E01 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x01%20Kiss%20Kiss%2C%20Bang%20Bang%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x01%20Kiss%20Kiss%2C%20Bang%20Bang%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E02 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x02%20La%20c%C3%A9lula%20dormida%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x02%20La%20c%C3%A9lula%20dormida%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E04 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x04%20Carne%20Carne%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x04%20Carne%20Carne%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E06 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x06%20Restauraci%C3%B3n%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x06%20Restauraci%C3%B3n%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E07 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x07%20Muerto%20viviente%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x07%20Muerto%20viviente%20%5BDual%5D%20%5B1080p%5D.mp4 | SLOW |
| S02E08 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x08%20Un%20d%C3%ADa%20en%20la%20muerte%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x08%20Un%20d%C3%ADa%20en%20la%20muerte%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E10 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x10%20De%20entre%20la%20lluvia%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x10%20De%20entre%20la%20lluvia%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S02E13 | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x13%20Heridas%20abiertas%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-2x-04-carne-carne-dual-1080p/Torchwood%202x13%20Heridas%20abiertas%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S03E01 | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x01%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Uno%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x01%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Uno%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S03E02 | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x02%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Dos%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S03E03 | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x03%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Tres%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x03%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Tres%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S03E04 | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x04%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Cuatro%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x04%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Cuatro%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S03E05 | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x05%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Cinco%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torchwood-temporada-3-dual-1080p/Torchwood%203x05%20Los%20Ni%C3%B1os%20de%20la%20Tierra%20-%20D%C3%ADa%20Cinco%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S04E01 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x01%20El%20D%C3%ADa%20del%20Milagro%20-%20El%20nuevo%20mundo%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S04E02 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x02%20El%20D%C3%ADa%20del%20Milagro%20-%20Extradicci%C3%B3n%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x02%20El%20D%C3%ADa%20del%20Milagro%20-%20Extradicci%C3%B3n%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S04E04 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x04%20El%20D%C3%ADa%20del%20Milagro%20-%20Escape%20a%20Los%20Angeles%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S04E05 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x05%20El%20D%C3%ADa%20del%20Milagro%20-%20Las%20categor%C3%ADas%20de%20la%20vida%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S04E06 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x06%20El%20D%C3%ADa%20del%20Milagro%20-%20Hombres%20corrientes%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x06%20El%20D%C3%ADa%20del%20Milagro%20-%20Hombres%20corrientes%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S04E08 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x08%20El%20D%C3%ADa%20del%20Milagro%20-%20Fase%20terminal%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x08%20El%20D%C3%ADa%20del%20Milagro%20-%20Fase%20terminal%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |
| S04E09 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x09%20El%20D%C3%ADa%20del%20Milagro%20-%20El%20Reencuentro%20%5BDual%5D%20%5B1080p%5D.mkv | HQ-only | HEALTHY |
| S04E10 | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x10%20El%20D%C3%ADa%20del%20Milagro%20-%20L%C3%ADnea%20de%20sangre%20%5BDual%5D%20%5B1080p%5D.mkv | https://archive.org/download/torch-wood-4x-04-el-dia-del-milagro-escape-a-los-angeles-dual-1080p/TorchWood%204x10%20El%20D%C3%ADa%20del%20Milagro%20-%20L%C3%ADnea%20de%20sangre%20%5BDual%5D%20%5B1080p%5D.mp4 | HEALTHY |

## Validation

- `npm run check`: passed, zero failures or warnings.
- `git diff --check`: passed.

Actual addon HTTP responses checked: 31 normal episodes, 56 streams; 0 failures. HQ first, Speed second when present, identical Arabic-first/English-second tracks across variants and subtitle resource. Local subtitle HEAD checks passed. All normal video URLs, all clean-cut mappings and S01E02 are unchanged.
