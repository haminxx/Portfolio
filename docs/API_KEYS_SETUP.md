# API Keys Setup Guide

This guide explains how to set up third-party API keys for your portfolio website.

**Official documentation:**
- [GitHub REST API – Users](https://docs.github.com/en/rest/users/users)
- [Verified on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/verified-on-linkedin/overview)

---

## Render Environment Variables

Your backend runs on [Render](https://render.com). For production, add all secrets in the **Render Dashboard**:

1. Open your Render service (the one running `server/`)
2. Go to **Environment** (left sidebar)
3. Add each variable (see table below)
4. Redeploy after adding variables

**Local development:** Use `server/.env`. Copy from `server/.env.example`. Never commit `.env`.

| Variable | Service | Required | Notes |
|----------|---------|----------|-------|
| `GITHUB_TOKEN` | GitHub | Optional | Higher rate limit (5,000/hr vs 60/hr) |
| `GITHUB_USER` | GitHub | Optional | Default: haminxx |
| `LINKEDIN_CLIENT_ID` | LinkedIn | If using Verified API | OAuth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | If using Verified API | OAuth |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | Optional | For search + Rebel album playback |
| `PORT` | Server | Auto | Render sets this |

**YouTube Music:** Uses [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) (scraper) for search when `YOUTUBE_API_KEY` is not set. With `YOUTUBE_API_KEY`, search uses YouTube Data API v3.

---

## 1. GitHub

**What it does:** Fetches your profile (avatar, bio, followers, repos) and top 3 recent repositories.

**Docs:** [GitHub REST API – Users](https://docs.github.com/en/rest/users/users)

**Where to add:** `server/.env` or Render → Environment

**Variable:** `GITHUB_TOKEN`

**How to get it:**
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select scope: `public_repo` (or no scope for read-only public data)
4. Copy the token (starts with `ghp_`)

**Without token:** 60 requests/hour. **With token:** 5,000 requests/hour.

---

## 2. YouTube Music

**What it does:** Search songs/albums/artists and display curated sections (including the Rebel album). Playback via YouTube embed.

**With `YOUTUBE_API_KEY`:** Search uses YouTube Data API v3 (`/api/youtube/search`). More reliable and returns video IDs for playback.

**Without API key:** Search falls back to [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) (scraper). Rebel album and curated items with `videoId` still play via embed.

**Variable:** `YOUTUBE_API_KEY` (optional)

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable **YouTube Data API v3**
4. Create credentials → API key
5. Restrict the key to YouTube Data API v3 (recommended)

**Curated content:** Edit `server/ytmusic-curated.js`. Add `videoId` to items for playback. Rebel album includes: Beat Crusaders - Moon on the Water, Oasis - Wonderwall, Oasis - Don't Look Back in Anger.

---

## 3. LinkedIn

**What it could do:** Display profile or verification badges.

**Docs:** [Verified on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/verified-on-linkedin/overview)

**Current setup:** [LinkedInProfileCard.jsx](src/components/LinkedInProfileCard.jsx) uses the official LinkedIn badge script. No API key needed.

**Verified on LinkedIn API:** For trust/verification badges (identity, workplace). Requires OAuth flow and [Lite tier](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/verified-on-linkedin/overview) for production. Not for displaying profile data.

**Variables (if using Verified API):** `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

---

## Summary

| Service | Variable(s) | Where to Add | Complexity |
|---------|-------------|---------------|------------|
| **GitHub** | `GITHUB_TOKEN` | `server/.env`, Render | Easy |
| **YouTube Music** | `YOUTUBE_API_KEY` | Render (optional) | Easy |
| **LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Render (if Verified API) | Medium |

---

## Security Notes

- Never commit `.env` or real API keys to Git
- Use `.env.example` as a template (no real values)
- On Render: set env vars in the dashboard
- Rotate keys if they are exposed
