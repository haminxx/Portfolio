# API Keys Setup Guide

This guide explains how to set up third-party API keys for your portfolio website.

**Official documentation:**
- [GitHub REST API – Users](https://docs.github.com/en/rest/users/users)
- [Instagram Platform](https://developers.facebook.com/docs/instagram-platform)
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
| `INSTAGRAM_ACCESS_TOKEN` | Instagram | If using API | Long-lived token (60 days) |
| `LINKEDIN_CLIENT_ID` | LinkedIn | If using Verified API | OAuth |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn | If using Verified API | OAuth |
| `PORT` | Server | Auto | Render sets this |

**YouTube Music:** No variables needed. Uses [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) (scraper, no API key).

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

**What it does:** Search songs/albums/artists and display curated sections. Uses the unofficial [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) package.

**No API key required.** The package scrapes YouTube Music directly.

**Curated content:** Edit `server/ytmusic-curated.js` to add your songs/albums. The frontend fetches from `/api/ytmusic/curated` and `/api/ytmusic/search`.

---

## 3. Instagram

**What it could do:** Show your recent posts, follower count, profile info.

**Docs:** [Instagram Platform](https://developers.facebook.com/docs/instagram-platform)

**Requirements:** Instagram **Business** or **Creator** account linked to a Facebook Page. Personal accounts are not supported.

**How to get it:**
1. Create a [Meta for Developers](https://developers.facebook.com/) account
2. Create an app → add **Instagram Graph API** (or **Instagram API with Facebook Login**)
3. Connect your Instagram Business/Creator account to a Facebook Page
4. Get a **Long-Lived Access Token** (60 days, renewable)

**Variable:** `INSTAGRAM_ACCESS_TOKEN`

**Note:** If you only have a personal account, keep the current static card/embed.

---

## 4. LinkedIn

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
| **YouTube Music** | None | N/A | Easy (ytmusic-api) |
| **Instagram** | `INSTAGRAM_ACCESS_TOKEN` | Render | Hard (Business/Creator account) |
| **LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Render (if Verified API) | Medium |

---

## Security Notes

- Never commit `.env` or real API keys to Git
- Use `.env.example` as a template (no real values)
- On Render: set env vars in the dashboard
- Rotate keys if they are exposed
