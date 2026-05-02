# Changelog

All notable changes to this project are documented here.

## [Unreleased] - 2026-05-02

### Added
- Fan-made addon branding asset with a navy/space vortex style, TARDIS-inspired silhouette, and Whoniverse Arabic identity.
- Subtitle cache-busting for Arabic primary and Arabic Alt subtitle URLs using a content-hash query parameter.

### Changed
- Expanded dynamic redirect coverage for slow episodes using current stream metadata, while keeping `/video/<episode-id>/<quality>` as HTTP 302 redirects.
- Enabled a safe 480p speed promotion path for `S04E01` only when the candidate is a true 480p stream and faster than the 1080p primary.
- Hid torrent fallback streams by default; they are now shown only when `SHOW_TORRENT_FALLBACK=true`.
- Improved `/status` reporting with subtitle freshness visibility (`subtitleCacheBusting`) and stream counters used for maintenance.

### Notes
- No Arabic subtitle timing/sync content was modified in these updates.
