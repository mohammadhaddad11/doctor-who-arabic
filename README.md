# Whoniverse Arabic 1080p

Production-ready Doctor Who Stremio addon with separate English and Arabic subtitle tracks.

## Repo Layout

- `index.js`: addon entry point
- `episodeData.js`: source of truth for episode coverage
- `arabicSubtitles.json`: canonical Arabic subtitle availability index
- `ar/`: production Arabic subtitle files
- `render.yaml`: Render deployment config

## Subtitle Behavior

- English subtitles are returned from the existing canonical English subtitle URLs in `episodeData.js`
- Arabic subtitles are returned as a separate selectable `ara` track
- Arabic availability is determined by `arabicSubtitles.json`
- Arabic subtitle URLs are derived from the English canonical basename and served from jsDelivr:
- `https://cdn.jsdelivr.net/gh/mohammadhaddad11/doctor-who-arabic@main/ar/`

Example:

- English: `E01_rose.srt`
- Arabic: `E01_rose.ar.srt`

## Local Run

```bash
npm install
npm start
```

Manifest:

```text
http://127.0.0.1:7000/manifest.json
```

## Render Deployment

This repo is ready for Render free-tier style deployment.

1. Push this repo to GitHub.
2. Create a Render Web Service from the repo.
3. Render will use `render.yaml`, or set:
4. Build command: `npm install`
5. Start command: `npm start`

## Railway Fallback

1. Create a Railway project from this same GitHub repo.
2. Deploy as a Node service.
3. Railway provides `PORT` automatically.

## Production Notes

- No local subtitle folder is required in production.
- No WSL path or local symlink is required.
- Streams are presented as `1080p` in the addon output.

## Stremio Result

- English and Arabic appear as two separate subtitle choices.
- They are not merged.
- They are not burned into video.
- They do not appear on screen simultaneously unless the user explicitly changes tracks.

All rights to Doctor Who belong to the BBC. This project is fan-made and non-commercial.
