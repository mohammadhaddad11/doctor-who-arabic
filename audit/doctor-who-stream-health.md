# Doctor Who Production Stream Audit

Generated: 2026-10-09T23:01:34.661065+00:00

## Scope and method

Audited 239 episodes, 327 existing HTTP stream options, and the 1996 movie separately. Initial 1 MiB and later 64 KiB ranges; flagged streams repeated with 4 MiB. MP4 indexes read by atom jumps with a 6–8 MB cap; no whole episodes downloaded or decoded. New derivative samples use bounded sub-second video windows and two-second audio windows.

This is a snapshot from one network location, not a sustained playback guarantee. Failed bounded sample retrieval does not establish a different edit.

Classification: HEALTHY requires a usable bounded media probe, correct initial/later byte ranges, TTFB at most 5 seconds, and measured body throughput at least 1.25 times the average media bitrate. SLOW indicates insufficient measured headroom or high startup latency. UNRELIABLE indicates intermittent request failures. BROKEN indicates a production route that failed repeatedly, even when the same file remains available through another route. Post-repair counts use the verified replacement-route measurements, not an assertion that every client can hardware-decode every codec.

The first pass used eight concurrent workers; flagged streams were repeated with three workers and larger samples. Host medians mix those bounded sample sizes and should be interpreted as comparative diagnostics, not sustained bandwidth guarantees.

## Episode primary health

| Stage | Healthy | Slow | Unreliable | Broken |
|---|---:|---:|---:|---:|
| Before changes | 206 | 23 | 2 | 8 |
| After verified route repairs | 237 | 0 | 2 | 0 |

Repaired 31 primary routes and 3 existing Speed routes; added 9 verified Speed streams. Existing HQ media files and subtitle timings are unchanged.

Validation: `npm run check` passed with no failures or warnings. Actual HTTP stream responses were checked for all 239 episode IDs and 336 stream options: zero mapping failures; repaired HQ URLs were first, Speed variants shared the same subtitle tracks, English remained available, and existing Arabic tracks were first. The temporary local addon process was stopped after the check.

## S01E03

The primary and existing Speed URLs were pinned to `ia600302.us.archive.org/24/items/nw_S01/`, which repeatedly timed out. Current metadata lists `dn801206.us.archive.org` and the public route resolved successfully to `dn711507.ca.archive.org`. The exact same files remain available. HQ is HEVC Main 10, 1872×1080, approximately 3.235 Mbps; its moov is near the end. The existing H.264 480p derivative provides a more compatible choice. Both URLs were changed to public `/download/nw_S01/` URLs, retaining their filenames and subtitles.

## Host comparison (before repairs)

| Host | Streams | Median TTFB s | Median Mbps | Healthy | Slow | Unreliable | Broken |
|---|---:|---:|---:|---:|---:|---:|---:|
| dn600200.us.archive.org | 22 | 1.522 | 7.483 | 22 | 0 | 0 | 0 |
| dn600207.us.archive.org | 2 | 1.675 | 15.143 | 2 | 0 | 0 | 0 |
| dn600300.us.archive.org | 14 | 1.539 | 7.703 | 13 | 1 | 0 | 0 |
| dn600303.us.archive.org | 13 | 1.544 | 7.561 | 12 | 1 | 0 | 0 |
| dn600308.us.archive.org | 21 | 1.53 | 7.609 | 20 | 1 | 0 | 0 |
| dn711403.ca.archive.org | 4 | 1.195 | 8.252 | 4 | 0 | 0 | 0 |
| dn711406.ca.archive.org | 2 | 1.326 | 7.962 | 2 | 0 | 0 | 0 |
| dn711408.ca.archive.org | 7 | 1.283 | 8.035 | 7 | 0 | 0 | 0 |
| dn711409.ca.archive.org | 3 | 1.314 | 8.09 | 2 | 0 | 1 | 0 |
| dn711500.ca.archive.org | 23 | 1.193 | 8.337 | 23 | 0 | 0 | 0 |
| dn711501.ca.archive.org | 19 | 1.239 | 8.343 | 19 | 0 | 0 | 0 |
| dn711502.ca.archive.org | 7 | 1.23 | 8.36 | 6 | 0 | 1 | 0 |
| dn711504.ca.archive.org | 7 | 1.18 | 8.171 | 7 | 0 | 0 | 0 |
| dn711505.ca.archive.org | 2 | 1.345 | 22.726 | 2 | 0 | 0 | 0 |
| dn711506.ca.archive.org | 1 | 1.174 | 8.047 | 1 | 0 | 0 | 0 |
| dn711507.ca.archive.org | 10 | 1.248 | 8.061 | 8 | 0 | 2 | 0 |
| dn711508.ca.archive.org | 1 | 2.382 | 8.06 | 1 | 0 | 0 | 0 |
| dn711509.ca.archive.org | 8 | 1.197 | 8.043 | 8 | 0 | 0 | 0 |
| dn800200.us.archive.org | 12 | 1.635 | 7.046 | 11 | 1 | 0 | 0 |
| dn800203.us.archive.org | 13 | 1.554 | 6.649 | 13 | 0 | 0 | 0 |
| dn800301.us.archive.org | 15 | 1.545 | 7.545 | 15 | 0 | 0 | 0 |
| dn800303.us.archive.org | 16 | 1.575 | 7.405 | 16 | 0 | 0 | 0 |
| dn801202.us.archive.org | 55 | 1.544 | 7.55 | 52 | 3 | 0 | 0 |
| ia600302.us.archive.org | 9 | None | None | 0 | 0 | 0 | 9 |
| ia600706.us.archive.org | 32 | 0.852 | 3.072 | 16 | 16 | 0 | 0 |
| ia800302.us.archive.org | 1 | None | None | 0 | 0 | 0 | 1 |
| ia800706.us.archive.org | 8 | 0.909 | 7.734 | 8 | 0 | 0 | 0 |

## New Speed streams

| Episode | HQ | Speed | Subtitle-safe evidence |
|---|---|---|---|
| S01E12 | https://archive.org/download/nw_S01/E12_bad_wolf.mp4 | https://archive.org/download/nw_S01/E12_bad_wolf.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S04E11 | https://archive.org/download/nw_S04/E11_turn_left.mp4 | https://archive.org/download/nw_S04/E11_turn_left.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E08 | https://archive.org/download/nw_S07/E08_the_power_of_three.mp4 | https://archive.org/download/nw_S07/E08_the_power_of_three.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E09 | https://archive.org/download/nw_S07/E09_the_angels_take_manhattan.mp4 | https://archive.org/download/nw_S07/E09_the_angels_take_manhattan.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E14 | https://archive.org/download/nw_S07/E14_the_snowmen_special.mp4 | https://archive.org/download/nw_S07/E14_the_snowmen_special.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E17 | https://archive.org/download/nw_S07/E17_the_rings_of_akhaten.mp4 | https://archive.org/download/nw_S07/E17_the_rings_of_akhaten.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E19 | https://archive.org/download/nw_S07/E19_cold_war.mp4 | https://archive.org/download/nw_S07/E19_cold_war.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E23 | https://archive.org/download/nw_S07/E23_the_crimson_horror.mp4 | https://archive.org/download/nw_S07/E23_the_crimson_horror.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |
| S07E27 | https://archive.org/download/nw_S07/E27_the_name_of_the_doctor.mp4 | https://archive.org/download/nw_S07/E27_the_name_of_the_doctor.ia.mp4 | Matching start/duration, sampled video and zero-offset audio subtitle anchors |

## Manual review

- Intermittent mapped network/range failures remain for S01E15 and S16E06; working retries do not establish permanent reliability.
- Movie 1996: public source returns HTTP 403 and Archive metadata marks the item dark; no verified replacement was found.
- Existing Arabic tracks are absent for: S05E17, S06E01, S06E02, S06E24, S07E01, S07E10, S07E12, S07E25, S07E26, S14E01, S15E10. No subtitle creation or retiming was performed.

| Candidate not added | Why |
|---|---|
| S01E01 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S01E10 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S01E11 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S01E13 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S01E14 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S01E15 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S02E11 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S03E14 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S04E04 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S04E20 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E05 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E18 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E20 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E21 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E22 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |
| S07E24 | Bounded timeline comparison incomplete or anchor threshold not met; no edit mismatch inferred |

## Complete canonical primary inventory

All returned primary and Speed URLs, headers, codecs, measurements and subtitle URLs are in the CSV and JSON. Dynamic addon URLs are recorded separately from tested media sources.

| Episode | Title | Production primary | Actual resolution | Container/codec | Before | After |
|---|---|---|---|---|---|
| S01E01 | Rose | https://archive.org/download/nw_S01/E01_rose.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E02 | The End of the World | https://dn711507.ca.archive.org/0/items/nw_S01/E02_the_end_of_the_world.mp4 | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E03 | The Unquiet Dead | https://archive.org/download/nw_S01/E03_the_unquiet_dead.mp4 | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E04 | Aliens of London | https://dn711507.ca.archive.org/0/items/nw_S01/E04_aliens_of_london.mp4 | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E05 | World War Three | http://127.0.0.1:7000/video/S01E05/1080p | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E06 | Dalek | http://127.0.0.1:7000/video/S01E06/1080p | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E07 | The Long Game | http://127.0.0.1:7000/video/S01E07/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E08 | Father's Day | https://dn711507.ca.archive.org/0/items/nw_S01/E08_fathers_day.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S01E09 | The Empty Child | https://archive.org/download/nw_S01/E09_the_empty_child.mp4 | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E10 | The Doctor Dances | https://archive.org/download/nw_S01/E10_the_doctor_dances.mp4 | 1872×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E11 | Boom Town | https://archive.org/download/nw_S01/E11_boom_town.mp4 | 1912×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E12 | Bad Wolf | https://archive.org/download/nw_S01/E12_bad_wolf.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E13 | The Parting of the Ways | https://archive.org/download/nw_S01/E13_the_parting_of_the_ways.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E14 | Born Again (Minisode) | https://archive.org/download/nw_S01/E14_born_again_minisode.mp4 | 720×576 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | BROKEN | HEALTHY |
| S01E15 | The Christmas Invasion (Special) | http://127.0.0.1:7000/video/S01E15/1080p | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | UNRELIABLE | UNRELIABLE |
| S02E01 | New Earth | https://ia800909.us.archive.org/11/items/nw_S02/E01_new_earth.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E02 | Tooth and Claw | https://ia600909.us.archive.org/11/items/nw_S02/E02_tooth_and_claw.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E03 | School Reunion | http://127.0.0.1:7000/video/S02E03/1080p | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E04 | The Girl in the Fireplace | https://ia800909.us.archive.org/11/items/nw_S02/E04_the_girl_in_the_fireplace.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E05 | Rise of the Cybermen | https://ia600909.us.archive.org/11/items/nw_S02/E05_rise_of_the_cybermen.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E06 | The Age of Steel | https://dn711408.ca.archive.org/0/items/nw_S02/E06_the_age_of_steel.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E07 | The Idiot's Lantern | https://dn711408.ca.archive.org/0/items/nw_S02/E07_the_idiots_lantern.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E08 | The Impossible Planet | https://ia800909.us.archive.org/11/items/nw_S02/E08_the_impossible_planet.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E09 | The Satan Pit | https://dn711408.ca.archive.org/0/items/nw_S02/E09_the_satan_pit.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E10 | Love & Monsters | https://ia800909.us.archive.org/11/items/nw_S02/E10_love_and_monsters.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E11 | Fear Her | https://archive.org/download/nw_S02/E11_fear_her.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S02E12 | Army of Ghosts | https://dn711408.ca.archive.org/0/items/nw_S02/E12_army_of_ghosts.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E13 | Doomsday | https://ia600909.us.archive.org/11/items/nw_S02/E13_doomsday.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S02E14 | The Runaway Bride (Special) | http://127.0.0.1:7000/video/S02E14/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E01 | Smith and Jones | http://127.0.0.1:7000/video/S03E01/1080p | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E02 | The Shakespeare Code | https://dn711500.ca.archive.org/0/items/nw_S03/E02_the_shakespeare_code.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E03 | Gridlock | https://dn711500.ca.archive.org/0/items/nw_S03/E03_gridlock.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E04 | Daleks in Manhattan | http://127.0.0.1:7000/video/S03E04/1080p | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E05 | Evolution of the Daleks | https://ia800600.us.archive.org/35/items/nw_S03/E05_evolution_of_the_daleks.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E06 | The Infinite Quest (Animated Series) | https://dn711500.ca.archive.org/0/items/nw_S03/E06_the_infinite_quest_animated_series.mp4 | 960×540 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S03E07 | The Lazarus Experiment | http://127.0.0.1:7000/video/S03E07/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E08 | 42 | https://dn711500.ca.archive.org/0/items/nw_S03/E08_42.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E09 | Human Nature | https://dn711500.ca.archive.org/0/items/nw_S03/E09_human_nature.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E10 | The Family of Blood | https://ia800600.us.archive.org/35/items/nw_S03/E10_the_family_of_blood.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E11 | Blink | https://ia800600.us.archive.org/35/items/nw_S03/E11_blink.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E12 | Utopia | http://127.0.0.1:7000/video/S03E12/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E13 | The Sound of Drums | https://ia800600.us.archive.org/35/items/nw_S03/E13_the_sound_of_drums.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E14 | Last of the Time Lords | https://archive.org/download/nw_S03/E14_last_of_the_time_lords.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S03E15 | Time Crash (Minisode) | https://dn711500.ca.archive.org/0/items/nw_S03/E15_time_crash_minisode.mp4 | 720×576 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S03E16 | Voyage of the Damned (Special) | http://127.0.0.1:7000/video/S03E16/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E01 | Partners in Crime | http://127.0.0.1:7000/video/S04E01/1080p | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E02 | The Fires of Pompeii | https://dn711501.ca.archive.org/0/items/nw_S04/E02_the_fires_of_pompeii.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E03 | Planet of the Ood | https://dn711501.ca.archive.org/0/items/nw_S04/E03_planet_of_the_ood.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E04 | The Sontaran Stratagem | https://archive.org/download/nw_S04/E04_the_sontaran_stratagem.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S04E05 | The Poison Sky | https://dn711501.ca.archive.org/0/items/nw_S04/E05_the_poison_sky.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E06 | The Doctor's Daughter | https://ia800908.us.archive.org/7/items/nw_S04/E06_the_doctors_daughter.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E07 | The Unicorn and the Wasp | https://ia800908.us.archive.org/7/items/nw_S04/E07_the_unicorn_and_the_wasp.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E08 | Silence in the Library | https://ia800908.us.archive.org/7/items/nw_S04/E08_silence_in_the_library.mp4 | 1888×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E09 | Forest of the Dead | https://ia800908.us.archive.org/7/items/nw_S04/E09_forest_of_the_dead.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E10 | Midnight | https://ia800908.us.archive.org/7/items/nw_S04/E10_midnight.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E11 | Turn Left | https://archive.org/download/nw_S04/E11_turn_left.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S04E12 | The Stolen Earth | https://dn711501.ca.archive.org/0/items/nw_S04/E12_the_stolen_earth.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E13 | Journey's End | https://dn711501.ca.archive.org/0/items/nw_S04/E13_journeys_end.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E14 | Music of the Spheres (Minisode) | https://ia600908.us.archive.org/7/items/nw_S04/E14_music_of_the_spheres_minisode.mp4 | 720×576 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S04E15 | The Next Doctor (Special) | https://ia600908.us.archive.org/7/items/nw_S04/E15_the_next_doctor_special.mp4 | 1880×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E16 | Planet of the Dead (Special) | https://dn711501.ca.archive.org/0/items/nw_S04/E16_planet_of_the_dead_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E17 | The Waters of Mars (Special) | https://ia800908.us.archive.org/7/items/nw_S04/E17_the_waters_of_mars_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E18 | Dreamland (Animated Series) | https://archive.org/download/nw_S04/E18_dreamland_animated_series.mp4 | 1280×720 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | SLOW | HEALTHY |
| S04E19 | The End of Time, Part One (Special) | http://127.0.0.1:7000/video/S04E19/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S04E20 | The End of Time, Part Two (Special) | http://127.0.0.1:7000/video/S04E20/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E01 | The Eleventh Hour | https://ia600708.us.archive.org/17/items/nw_S05/E01_the_eleventh_hour.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E02 | Meanwhile in the TARDIS, Part 1 (Minisode) | http://127.0.0.1:7000/video/S05E02/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E03 | The Beast Below | https://ia600708.us.archive.org/17/items/nw_S05/E03_the_beast_below.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E04 | Victory of the Daleks | https://ia600708.us.archive.org/17/items/nw_S05/E04_victory_of_the_daleks.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E05 | The Time of Angels | https://ia600708.us.archive.org/17/items/nw_S05/E05_the_time_of_angels.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E06 | Flesh and Stone | http://127.0.0.1:7000/video/S05E06/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E07 | Meanwhile in the TARDIS, Part 2 (Minisode) | https://ia800708.us.archive.org/17/items/nw_S05/E07_meanwhile_in_the_tardis_2_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E08 | The Vampires of Venice | https://ia800708.us.archive.org/17/items/nw_S05/E08_the_vampires_of_venice.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E09 | Amy's Choice | https://ia800708.us.archive.org/17/items/nw_S05/E09_amys_choice.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E10 | The Hungry Earth | https://ia800708.us.archive.org/17/items/nw_S05/E10_the_hungry_earth.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E11 | Cold Blood | https://archive.org/download/nw_S05/E11_cold_blood.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S05E12 | Good as Gold (Minisode) | https://ia600708.us.archive.org/17/items/nw_S05/E12_good_as_gold_minisode.mp4 | 720×576 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E13 | Vincent and the Doctor | https://ia600708.us.archive.org/17/items/nw_S05/E13_vincent_and_the_doctor.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E14 | The Lodger | https://ia600708.us.archive.org/17/items/nw_S05/E14_the_lodger.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E15 | The Pandorica Opens | https://ia600708.us.archive.org/17/items/nw_S05/E15_the_pandorica_opens.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E16 | The Big Bang | https://ia800708.us.archive.org/17/items/nw_S05/E16_the_big_bang.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S05E17 | Death is the Only Answer (Minisode) | https://ia600708.us.archive.org/17/items/nw_S05/E17_death_is_the_only_answer_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S05E18 | A Christmas Carol (Special) | http://127.0.0.1:7000/video/S05E18/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E01 | Space (Minisode) | https://dn711501.ca.archive.org/0/items/nw_S06/E01_space_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E02 | Time (Minisode) | https://dn711501.ca.archive.org/0/items/nw_S06/E02_time_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E03 | The Impossible Astronaut (Prequel) | https://dn711501.ca.archive.org/0/items/nw_S06/E03_the_impossible_astronaut_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E04 | The Impossible Astronaut | http://127.0.0.1:7000/video/S06E04/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E05 | Day of the Moon | https://ia800100.us.archive.org/32/items/nw_S06/E05_day_of_the_moon.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E06 | The Curse of the Black Spot (Prequel) | https://dn711501.ca.archive.org/0/items/nw_S06/E06_the_curse_of_the_black_spot_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E07 | The Curse of the Black Spot | https://ia600100.us.archive.org/32/items/nw_S06/E07_the_curse_of_the_black_spot.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E08 | Bad Night (Minisode) | https://ia600100.us.archive.org/32/items/nw_S06/E08_bad_night_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E09 | The Doctor's Wife | https://ia800100.us.archive.org/32/items/nw_S06/E09_the_doctors_wife.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E10 | Good Night (Minisode) | https://ia800100.us.archive.org/32/items/nw_S06/E10_good_night_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E11 | The Rebel Flesh | https://ia600100.us.archive.org/32/items/nw_S06/E11_the_rebel_flesh.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E12 | The Almost People | https://ia600100.us.archive.org/32/items/nw_S06/E12_the_almost_people.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E13 | A Good Man Goes to War (Prequel) | https://dn711501.ca.archive.org/0/items/nw_S06/E13_a_good_man_goes_to_war_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E14 | A Good Man Goes to War | https://dn711501.ca.archive.org/0/items/nw_S06/E14_a_good_man_goes_to_war.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E15 | Let's Kill Hitler (Prequel) | https://ia800100.us.archive.org/32/items/nw_S06/E15_lets_kill_hitler_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E16 | Let's Kill Hitler | https://ia800100.us.archive.org/32/items/nw_S06/E16_lets_kill_hitler.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E17 | Night Terrors | https://ia800100.us.archive.org/32/items/nw_S06/E17_night_terrors.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E18 | First Night (Minisode) | https://ia600100.us.archive.org/32/items/nw_S06/E18_first_night_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E19 | Last Night (Minisode) | https://ia800100.us.archive.org/32/items/nw_S06/E19_last_night_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E20 | The Girl Who Waited | https://ia600100.us.archive.org/32/items/nw_S06/E20_the_girl_who_waited.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E21 | The God Complex | https://ia600100.us.archive.org/32/items/nw_S06/E21_the_god_complex.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E22 | Up All Night (Minisode) | https://ia600100.us.archive.org/32/items/nw_S06/E22_up_all_night_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E23 | Closing Time | https://ia600100.us.archive.org/32/items/nw_S06/E23_closing_time.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E24 | The Wedding of River Song (Prequel) | https://ia600100.us.archive.org/32/items/nw_S06/E24_the_wedding_of_river_song_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E25 | The Wedding of River Song | https://ia600100.us.archive.org/32/items/nw_S06/E25_the_wedding_of_river_song.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E26 | The Doctor, the Widow and the Wardrobe (Prequel) | https://ia800100.us.archive.org/32/items/nw_S06/E26_the_doctor_the_widow_and_the_wardrobe_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S06E27 | The Doctor, the Widow and the Wardrobe (Special) | https://dn711501.ca.archive.org/0/items/nw_S06/E27_the_doctor_the_widow_and_the_wardrobe_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E01 | Pond Life (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E01_pond_life_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E02 | Asylum of the Daleks (Prequel) | https://ia800706.us.archive.org/7/items/nw_S07/E02_asylum_of_the_daleks_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E03 | Asylum of the Daleks | http://127.0.0.1:7000/video/S07E03/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E04 | The Inforarium (Minisode) | http://127.0.0.1:7000/video/S07E04/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E05 | Dinosaurs on a Spaceship | https://archive.org/download/nw_S07/E05_dinosaurs_on_a_spaceship.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E06 | The Making of the Gunslinger (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E06_the_making_of_the_gunslinger_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E07 | A Town Called Mercy | https://ia800706.us.archive.org/7/items/nw_S07/E07_a_town_called_mercy.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E08 | The Power of Three | https://archive.org/download/nw_S07/E08_the_power_of_three.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E09 | The Angels Take Manhattan | https://archive.org/download/nw_S07/E09_the_angels_take_manhattan.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E10 | P.S. (Minisode) | https://ia600706.us.archive.org/7/items/nw_S07/E10_p.s._minisode.mp4 | 854×480 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S07E11 | The Battle of Demon's Run: Two Days Later (Prequel) | https://ia800706.us.archive.org/7/items/nw_S07/E11_the_battle_of_demons_run_two_days_later_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E12 | The Great Detective (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E12_the_great_detective_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E13 | Vastra Investigates (Prequel) | https://archive.org/download/nw_S07/E13_vastra_investigates_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E14 | The Snowmen (Special) | https://archive.org/download/nw_S07/E14_the_snowmen_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E15 | The Bells of Saint John (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E15_the_bells_of_saint_john_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E16 | The Bells of Saint John | https://archive.org/download/nw_S07/E16_the_bells_of_saint_john.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E17 | The Rings of Akhaten | https://archive.org/download/nw_S07/E17_the_rings_of_akhaten.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E18 | Rain Gods (Minisode) | https://archive.org/download/nw_S07/E18_rain_gods_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E19 | Cold War | https://archive.org/download/nw_S07/E19_cold_war.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E20 | Hide | https://archive.org/download/nw_S07/E20_hide.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E21 | Journey to the Centre of the TARDIS | https://archive.org/download/nw_S07/E21_journey_to_the_centre_of_the_tardis.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E22 | Clara and the TARDIS (Minisode) | https://archive.org/download/nw_S07/E22_clara_and_the_tardis_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E23 | The Crimson Horror | https://archive.org/download/nw_S07/E23_the_crimson_horror.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E24 | Nightmare in Silver | https://archive.org/download/nw_S07/E24_nightmare_in_silver.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E25 | Clarence and the Whispermen (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E25_clarence_and_the_whispermen_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E26 | She Said, He Said (Prequel) | https://ia600706.us.archive.org/7/items/nw_S07/E26_she_said_he_said_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E27 | The Name of the Doctor | https://archive.org/download/nw_S07/E27_the_name_of_the_doctor.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E28 | The Night of the Doctor (Minisode) | https://ia600706.us.archive.org/7/items/nw_S07/E28_the_night_of_the_doctor_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E29 | The Last Day (Minisode) | https://ia800706.us.archive.org/7/items/nw_S07/E29_the_last_day_minisode.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S07E30 | The Day of the Doctor (Special) | https://archive.org/download/nw_S07/E30_the_day_of_the_doctor_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S07E31 | The Time of the Doctor (Special) | https://archive.org/download/nw_S07/E31_the_time_of_the_doctor_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S08E01 | Deep Breath (Prequel) | https://archive.org/download/nw_S08/E01_deep_breath_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | SLOW | HEALTHY |
| S08E02 | Deep Breath | https://ia600707.us.archive.org/33/items/nw_S08/E02_deep_breath.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E03 | Into the Dalek | https://ia800707.us.archive.org/33/items/nw_S08/E03_into_the_dalek.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E04 | Robot of Sherwood | https://ia600707.us.archive.org/33/items/nw_S08/E04_robot_of_sherwood.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E05 | Listen | http://127.0.0.1:7000/video/S08E05/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E06 | Time Heist | https://ia600707.us.archive.org/33/items/nw_S08/E06_time_heist.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E07 | The Caretaker | https://dn711509.ca.archive.org/0/items/nw_S08/E07_the_caretaker.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E08 | Kill the Moon | http://127.0.0.1:7000/video/S08E08/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E09 | Mummy on the Orient Express | https://ia600707.us.archive.org/33/items/nw_S08/E09_mummy_on_the_orient_express.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E10 | Flatline | https://ia600707.us.archive.org/33/items/nw_S08/E10_flatline.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E11 | In the Forest of the Night | https://ia600707.us.archive.org/33/items/nw_S08/E11_in_the_forest_of_the_night.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E12 | Dark Water | https://ia600707.us.archive.org/33/items/nw_S08/E12_dark_water.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E13 | Death in Heaven | https://ia800707.us.archive.org/33/items/nw_S08/E13_death_in_heaven.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S08E14 | Last Christmas (Special) | http://127.0.0.1:7000/video/S08E14/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E01 | Prologue (Prequel) | https://ia801805.us.archive.org/21/items/nw_S09/E01_prologue_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E02 | The Doctor's Meditation (Prequel) | http://127.0.0.1:7000/video/S09E02/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E03 | The Magician's Apprentice | https://ia601805.us.archive.org/21/items/nw_S09/E03_the_magicians_apprentice.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E04 | The Witch's Familiar | https://ia601805.us.archive.org/21/items/nw_S09/E04_the_witchs_familiar.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E05 | Under the Lake | https://ia601805.us.archive.org/21/items/nw_S09/E05_under_the_lake.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E06 | Before the Flood | https://ia801805.us.archive.org/21/items/nw_S09/E06_before_the_flood.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E07 | The Girl Who Died | https://ia601805.us.archive.org/21/items/nw_S09/E07_the_girl_who_died.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E08 | The Woman Who Lived | https://ia801805.us.archive.org/21/items/nw_S09/E08_the_woman_who_lived.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E09 | The Zygon Invasion | https://ia801805.us.archive.org/21/items/nw_S09/E09_the_zygon_invasion.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E10 | The Zygon Inversion | https://ia801805.us.archive.org/21/items/nw_S09/E10_the_zygon_inversion.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E11 | Sleep No More | https://ia601805.us.archive.org/21/items/nw_S09/E11_sleep_no_more.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E12 | Face the Raven | https://ia601805.us.archive.org/21/items/nw_S09/E12_face_the_raven.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E13 | Heaven Sent | https://ia801805.us.archive.org/21/items/nw_S09/E13_heaven_sent.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E14 | Hell Bent | https://ia601805.us.archive.org/21/items/nw_S09/E14_hell_bent.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E15 | The Husbands of River Song (Special) | https://ia801805.us.archive.org/21/items/nw_S09/E15_the_husbands_of_river_song_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S09E16 | The Return of Doctor Mysterio (Special) | https://ia801805.us.archive.org/21/items/nw_S09/E16_the_return_of_doctor_mysterio_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E01 | Friend from the Future (Prequel) | https://ia800904.us.archive.org/0/items/nw_S10/E01_friend_from_the_future_prequel.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S10E02 | The Pilot | http://127.0.0.1:7000/video/S10E02/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E03 | Smile | http://127.0.0.1:7000/video/S10E03/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E04 | Thin Ice | https://dn711504.ca.archive.org/0/items/nw_S10/E04_thin_ice.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E05 | Knock Knock | https://dn711504.ca.archive.org/0/items/nw_S10/E05_knock_knock.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E06 | Oxygen | https://ia800904.us.archive.org/0/items/nw_S10/E06_oxygen.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E07 | Extremis | https://ia800904.us.archive.org/0/items/nw_S10/E07_extremis.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E08 | The Pyramid at the End of the World | https://ia800904.us.archive.org/0/items/nw_S10/E08_the_pyramid_at_the_end_of_the_world.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E09 | The Lie of the Land | https://ia800904.us.archive.org/0/items/nw_S10/E09_the_lie_of_the_land.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E10 | Empress of Mars | https://ia600904.us.archive.org/0/items/nw_S10/E10_empress_of_mars.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E11 | The Eaters of Light | https://dn711504.ca.archive.org/0/items/nw_S10/E11_the_eaters_of_light.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E12 | World Enough and Time | https://ia800904.us.archive.org/0/items/nw_S10/E12_world_enough_and_time.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E13 | The Doctor Falls | https://ia800904.us.archive.org/0/items/nw_S10/E13_the_doctor_falls.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S10E14 | Twice Upon a Time (Special) | https://ia800904.us.archive.org/0/items/nw_S10/E14_twice_upon_a_time_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E01 | The Woman Who Fell to Earth | https://ia600602.us.archive.org/21/items/nw_S11/E01_the_woman_who_fell_to_earth.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E02 | The Ghost Monument | https://dn711406.ca.archive.org/0/items/nw_S11/E02_the_ghost_monument.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E03 | Rosa | https://ia600602.us.archive.org/21/items/nw_S11/E03_rosa.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E04 | Arachnids in the UK | https://ia600602.us.archive.org/21/items/nw_S11/E04_arachnids_in_the_uk.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E05 | The Tsuranga Conundrum | https://ia600602.us.archive.org/21/items/nw_S11/E05_the_tsuranga_conundrum.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E06 | Demons of the Punjab | https://dn711406.ca.archive.org/0/items/nw_S11/E06_demons_of_the_punjab.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E07 | Kerblam! | https://ia600602.us.archive.org/21/items/nw_S11/E07_kerblam.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E08 | The Witchfinders | https://ia600602.us.archive.org/21/items/nw_S11/E08_the_witchfinders.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E09 | It Takes You Away | https://ia800602.us.archive.org/21/items/nw_S11/E09_it_takes_you_away.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E10 | The Battle of Ranskoor Av Kolos | https://ia600602.us.archive.org/21/items/nw_S11/E10_the_battle_of_ranskoor_av_kolos.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S11E11 | Resolution (Special) | https://ia600602.us.archive.org/21/items/nw_S11/E11_resolution_special.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E01 | Spyfall, Part 1 | http://127.0.0.1:7000/video/S12E01/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E02 | Spyfall, Part 2 | https://ia800904.us.archive.org/13/items/nw_S12/E02_spyfall_part_2.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E03 | Orphan 55 | http://127.0.0.1:7000/video/S12E03/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E04 | Nikola Tesla's Night of Terror | https://ia600904.us.archive.org/13/items/nw_S12/E04_nikola_teslas_night_of_terror.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E05 | Fugitive of the Judoon | https://ia600904.us.archive.org/13/items/nw_S12/E05_fugitive_of_the_judoon.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E06 | Praxeus | https://ia800904.us.archive.org/13/items/nw_S12/E06_praxeus.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E07 | Can You Hear Me? | https://ia600904.us.archive.org/13/items/nw_S12/E07_can_you_hear_me.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E08 | The Haunting of Villa Diodati | https://ia800904.us.archive.org/13/items/nw_S12/E08_the_haunting_of_villa_diodati.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E09 | Ascension of the Cybermen | https://ia800904.us.archive.org/13/items/nw_S12/E09_ascension_of_the_cybermen.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E10 | The Timeless Children | https://ia600904.us.archive.org/13/items/nw_S12/E10_the_timeless_children.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S12E11 | Revolution of the Daleks (Special) | https://dn711403.ca.archive.org/0/items/nw_S12/E11_revolution_of_the_daleks_special.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E01 | The Halloween Apocalypse | https://dn711500.ca.archive.org/0/items/nw_S13/E01_the_halloween_apocalypse.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E02 | War of the Sontarans | http://127.0.0.1:7000/video/S13E02/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E03 | Once, Upon Time | https://ia800705.us.archive.org/27/items/nw_S13/E03_once_upon_time.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E04 | Village of the Angels | https://dn711500.ca.archive.org/0/items/nw_S13/E04_village_of_the_angels.mp4 | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E05 | Survivors of the Flux | http://127.0.0.1:7000/video/S13E05/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E06 | The Vanquishers | http://127.0.0.1:7000/video/S13E06/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E07 | Eve of the Daleks (Special) | http://127.0.0.1:7000/video/S13E07/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / hevc | HEALTHY | HEALTHY |
| S13E08 | Legend of the Sea Devils (Special) | http://127.0.0.1:7000/video/S13E08/1080p | 1920×960 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S13E09 | The Power of the Doctor (Special) | https://ia600705.us.archive.org/27/items/nw_S13/E09_the_power_of_the_doctor_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S14E01 | Destination: Skaro (Minisode) | http://127.0.0.1:7000/video/S14E01/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S14E02 | The Star Beast (Special) | https://dn711505.ca.archive.org/0/items/nw_S14/E02_the_star_beast_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S14E03 | Wild Blue Yonder (Special) | http://127.0.0.1:7000/video/S14E03/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S14E04 | The Giggle (Special) | http://127.0.0.1:7000/video/S14E04/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E01 | The Church on Ruby Road (Special) | http://127.0.0.1:7000/video/S15E01/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E02 | Space Babies | https://dn711502.ca.archive.org/0/items/nw_S15/E02_space_babies.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E03 | The Devil's Chord | http://127.0.0.1:7000/video/S15E03/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E04 | Boom | https://ia600704.us.archive.org/4/items/nw_S15/E04_boom.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E05 | 73 Yards | https://dn711502.ca.archive.org/0/items/nw_S15/E05_73_yards.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E06 | Dot and Bubble | https://ia800704.us.archive.org/4/items/nw_S15/E06_dot_and_bubble.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E07 | Rogue | https://ia800704.us.archive.org/4/items/nw_S15/E07_rogue.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E08 | The Legend of Ruby Sunday | https://ia800704.us.archive.org/4/items/nw_S15/E08_the_legend_of_ruby_sunday.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E09 | Empire of Death | https://ia800704.us.archive.org/4/items/nw_S15/E09_empire_of_death.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E10 | Bad Music (Minisode) | https://ia600704.us.archive.org/4/items/nw_S15/E10_bad_music_minisode.mp4 | 1280×720 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S15E11 | Joy to the World (Special) | https://dn711502.ca.archive.org/0/items/nw_S15/E11_joy_to_the_world_special.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E01 | The Robot Revolution | http://127.0.0.1:7000/video/S16E01/1080p | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E02 | Lux | https://dn711409.ca.archive.org/0/items/nw_S16/E02_lux.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E03 | The Well | https://ia800900.us.archive.org/19/items/nw_S16/E03_the_well.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E04 | Lucky Day | https://ia600900.us.archive.org/19/items/nw_S16/E04_lucky_day.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E05 | The Story and the Engine | https://ia600900.us.archive.org/19/items/nw_S16/E05_the_story_and_the_engine.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E06 | The Interstellar Song Contest | https://dn711409.ca.archive.org/0/items/nw_S16/E06_the_interstellar_song_contest.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | UNRELIABLE | UNRELIABLE |
| S16E07 | Wish World | https://dn711409.ca.archive.org/0/items/nw_S16/E07_wish_world.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
| S16E08 | The Reality War | https://ia800900.us.archive.org/19/items/nw_S16/E08_the_reality_war.mp4 | 1920×1080 | mov,mp4,m4a,3gp,3g2,mj2 / h264 | HEALTHY | HEALTHY |
