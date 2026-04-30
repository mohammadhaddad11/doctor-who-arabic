# Whoniverse Arabic for Stremio

Whoniverse Arabic is a Doctor Who Stremio addon focused on New Who broadcast-order viewing with separate English and Arabic subtitle tracks.

Current public manifest:

- `https://whoniverse-arabic.onrender.com/manifest.json`

## What's Included

- Main episodes from 2005 to 2025
- Specials kept inside their parent seasons
- Separate selectable English and Arabic subtitle tracks in Stremio
- 1080p primary streams with 480p speed options and internal fast-start host selection where helpful
- Metadata, thumbnails, dates, and descriptions from the curated episode dataset

## Recently Fixed

- Arabic subtitle encoding normalized to UTF-8 with BOM where needed
- Time of the Doctor subtitle sync work documented and kept visible with manual-review status
- Series 7 subtitle displacement chain fixed and remapped
- 480p speed options added across most episodes and specials
- Render deployment available at `https://whoniverse-arabic.onrender.com/manifest.json`

## Repo Layout

- `index.js`: addon entry point
- `episodeData.js`: source-of-truth episode list
- `ar/`: production Arabic subtitle files
- `arabicSubtitles.json`: Arabic subtitle availability index
- `streamMetadata.json`: audited stream sizes, speed categories, and quality alternatives
- `render.yaml`: Render fallback deployment config
- `Dockerfile`: provider-neutral container deployment for Koyeb and Northflank

## Required Environment Variable

Set this on every public host:

- `ADDON_BASE_URL=https://your-public-app-domain`

The addon uses that base URL to build absolute Arabic subtitle URLs.

## Deployment

### Koyeb

1. Create a Koyeb Web Service from this GitHub repo.
2. Use the included `Dockerfile`.
3. Set `ADDON_BASE_URL` to your Koyeb app URL.
4. Koyeb will provide `PORT` automatically.

### Northflank

1. Create a Northflank service from this GitHub repo.
2. Use the included `Dockerfile`.
3. Set `ADDON_BASE_URL` to your Northflank service URL.
4. Keep the service port dynamic through `PORT`.

### Render Fallback

1. Create a new Render Web Service from this repo.
2. Render can use `render.yaml`, or set:
3. Build command: `npm install`
4. Start command: `npm start`
5. Set `ADDON_BASE_URL` to the Render service URL.

## Health and Reporting

- `/` homepage with install and report links
- `/healthz` basic health JSON
- `/status` detailed production counters
- `/report` copy-paste subtitle issue flow

## Local Run

```bash
npm install
npm start
```

Local manifest:

```text
http://127.0.0.1:7000/manifest.json
```

## Notes

- English subtitles remain available through the existing canonical English subtitle URLs.
- Arabic subtitles are exposed as a separate selectable `ara` track only when a canonical Arabic file exists in `ar/` and in `arabicSubtitles.json`.
- Direct Archive.org streams remain the primary strategy.
- Torrent fallback is intentionally not the default architecture and is only appropriate for proven bad direct cases.
- The visible stream model is intentionally simple: `1080p • Quality` and `480p • Speed`.

---

All rights to Doctor Who belong to the BBC. This project is fan-made and non-commercial.
