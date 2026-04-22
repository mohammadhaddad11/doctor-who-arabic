# Whoniverse Arabic for Stremio

Whoniverse Arabic is a Doctor Who Stremio addon focused on New Who broadcast-order viewing with separate English and Arabic subtitle tracks.

## What's Included

- Main episodes from 2005 to 2025
- Specials kept inside their parent seasons
- Separate selectable English and Arabic subtitle tracks in Stremio
- 1080p stream presentation across the addon
- Metadata, thumbnails, dates, and descriptions from the curated episode dataset

## Arabic Subtitle Source

- Production Arabic subtitles are served from jsDelivr:
- `https://cdn.jsdelivr.net/gh/mohammadhaddad11/doctor-who-arabic@main/ar/`

## Deployment

### Render

1. Push this addon code to a Git repository.
2. Create a new Render Web Service from that repository.
3. Render will pick up `render.yaml` automatically, or use:
4. Build command: `npm install`
5. Start command: `npm start`

### Railway

1. Create a new Railway project from the addon repository.
2. Use the default Node deployment flow.
3. Railway will provide `PORT` automatically.

No local subtitle directory is required in production. Arabic subtitles are resolved from the remote CDN by canonical filename.

## Notes

- English subtitles remain available through the existing canonical English subtitle URLs.
- Arabic subtitles are exposed as a separate selectable `ara` track only when a canonical Arabic file exists remotely.

---

All rights to Doctor Who belong to the BBC. This project is fan-made and non-commercial.
