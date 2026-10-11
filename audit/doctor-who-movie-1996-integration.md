# Doctor Who 1996 Movie Integration

Generated: 2026-10-11T08:34:40.447Z

## Existing production mapping

Movie ID: `doctor-who-movie-1996`

Old URL: https://archive.org/download/doctor-who-the-movie-1996-1080p-blu-ray-hdr-10-flac-2-0-x-265-gene-mige/Doctor%20Who%20The%20Movie%201996%201080p%20BluRay%20HDR10%20FLAC%202%200%20x265-GeneMige.mkv

Current HEAD returned 403; the old Archive item is dark. It has been removed from the visible movie streams.

Existing external subtitle: `movie-subtitles/doctor-who-movie-1996.primary.improved.ar.srt` (960 Arabic cues). No external English file was mapped. New HQ retains embedded English text/PGS tracks; both addon variants share the unchanged external Arabic track.

## Archive inventory

| Filename | Source | Size bytes | Container/video/audio | Resolution | FPS | Duration | Required Mbps |
|---|---|---:|---|---|---|---:|---:|
| 1996 movie.mkv | original | 5104562536 | matroska,webm / hevc / flac/eac3 | 1920x1080, 4:3 display | 24000/1001 | 5408.820000 s | 7.550 |
| 1996 movie.mp4 | derivative | 540314043 | mov,mp4,m4a,3gp,3g2,mj2 / h264 / aac | 640x480, 4:3 display | 1199/50 | 5408.840701 s | 0.799 |

HQ URL: https://archive.org/download/1996-movie/1996%20movie.mkv

HQ Archive MD5: `f78b5d420f4188fe41afee3b2cb1c855`; SHA-1: `f420027997e2b291c46fefd54926efc9c983779b`

Speed URL: https://archive.org/download/1996-movie/1996%20movie.mp4

Speed Archive MD5: `354684f2776e831228727628d56998b6`; SHA-1: `730193be013a6c24641ce087371880b0db6d7731`

HQ is coded 1920x1080 with 3:4 sample aspect ratio and 4:3 display; Archive lists the display-equivalent 1440x1080. Speed is 640x480 square-pixel 4:3.

## Timeline verification

**SUBTITLE SAFE: YES — HQ and Speed.** Existing lightweight beginning, middle and ending observations show the same events within less than one video frame. Two dialogue timestamps match the existing Arabic meanings with a constant 5 ms muxing offset. No retiming is required.

HQ audio duration from its FLAC header is 5394.976 s, Speed AAC is 5394.981 s. HQ video/container ends at about 5408.82 s; Speed video/container at 5408.840701 s. Thus there is no missing final audio: the original also has a video-only credit tail. Rounded 23.98 fps is not a different PAL-speed timeline.

No further correlation analysis or repeated decoding was performed after the user stopped deep verification. Old checksum identity could not be established because the old item is dark; exact intended size, media properties and existing subtitle-time evidence establish compatibility.

## Performance

Three 4 MiB initial ranges and three 4 MiB later ranges at 150 MiB per candidate; every test returned correct 206 and exact requested bytes. HEAD returned 200, Accept-Ranges: bytes and matching full Content-Length. Canonical public URLs were used; final hosts varied between ia803201.us.archive.org and ia903201.us.archive.org.

| Variant | Required Mbps | Median Mbps | Min Mbps | Max Mbps | Median TTFB | Median total 4 MiB time | Headroom | Classification |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| HQ | 7.550 | 21.739 | 5.935 | 23.416 | 1.493 s | 3.125 s | 2.88x | GOOD |
| Speed | 0.799 | 15.114 | 2.569 | 23.178 | 1.470 s | 3.783 s | 18.91x | EXCELLENT |

These are bounded observations, not a guarantee of sustained playback. HQ had one sub-bitrate sample; Speed has ample headroom even in its weakest sample. The MP4 derivative is faststart, with moov at byte 32, size 4144386 bytes.

## Final production order

1. **Doctor Who 1996 • HQ** — https://archive.org/download/1996-movie/1996%20movie.mkv
2. **Doctor Who 1996 • Speed** — https://archive.org/download/1996-movie/1996%20movie.mp4

Both variants expose the same unchanged external Arabic subtitle. English second is not applicable because no external English movie mapping existed. The HQ file contains embedded English tracks.

## Validation

- `npm run check`: passed, zero failures or warnings.
- `git diff --check`: passed.

Actual local movie stream, subtitle and metadata responses passed. Correct movie ID, two ordered canonical URLs, shared Arabic-first subtitle, no old URL, and unchanged subtitle content version. Doctor Who episode and all Torchwood returned mappings were compared against a pre-change snapshot and are unchanged. No commit or push performed.
