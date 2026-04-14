# API Keys Setup Guide

Third-party keys for the portfolio backend (`server/`).

**Local:** use `server/.env` (copy from `server/.env.example`). Never commit `.env`.

---

## Render environment variables

Add secrets in the Render dashboard for your `server/` service, then redeploy.

| Variable | Service | Required | Notes |
|----------|---------|----------|-------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Optional | Music search + playback metadata |
| `ORS_API_KEY` | OpenRouteService | Optional | Road-following routes in Map app |
| `OSRM_BASE_URL` | Self-hosted OSRM | Optional | Alternative routing base |
| `PORT` | Server | Auto | Render sets this |

**YouTube Music:** Uses [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) when `YOUTUBE_API_KEY` is not set. With the key, search uses YouTube Data API v3.

**How to get `YOUTUBE_API_KEY`:**
1. [Google Cloud Console](https://console.cloud.google.com/) → project → enable **YouTube Data API v3**
2. Create credentials → API key
3. Restrict the key to YouTube Data API v3 (recommended)

Curated tracks: edit `server/ytmusic-curated.js`; add `videoId` for reliable embed playback.

---

## Security

- Never commit API keys or paste them into client-side code.
- Restrict keys by HTTP referrer or IP where the provider allows it.
