# API Keys Setup Guide

This guide explains how to set up third-party API keys for your portfolio website.

---

## 1. GitHub (Already Implemented)

**What it does:** Fetches your profile (avatar, bio, followers, repos) and top 3 recent repositories.

**Where to add the key:**
- **Backend (server/):** Add to `server/.env` or Render environment variables
- Variable: `GITHUB_TOKEN`

**How to get it:**
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Select scope: `public_repo` (or no scope for read-only public data)
4. Copy the token (starts with `ghp_`)

**Without token:** 60 requests/hour. **With token:** 5,000 requests/hour.

---

## 2. YouTube Music

**What it could do:** Display your playlists, recently played, or favorite tracks.

**Requirements:**
- YouTube Data API v3 (Google Cloud)
- OAuth 2.0 for user-specific data, or API key for public data

**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **YouTube Data API v3**
4. Create credentials → API key (for public data) or OAuth (for user playlists)

**Variables to add:**
- `YOUTUBE_API_KEY` – for public/channel data
- For user playlists: OAuth flow (more complex, requires backend)

**Note:** YouTube Music doesn’t have a dedicated public API. You’d use YouTube Data API for channel/playlist data. User-specific “Music” data may require OAuth.

---

## 3. Instagram

**What it could do:** Show your recent posts, follower count, profile info.

**Requirements:**
- **Instagram Basic Display API** – deprecated, avoid for new projects
- **Instagram Graph API** – requires a Facebook/Meta Developer account and an Instagram Business or Creator account

**How to get it:**
1. Create a [Meta for Developers](https://developers.facebook.com/) account
2. Create an app → add **Instagram Graph API**
3. Connect your Instagram Business/Creator account
4. Get **Access Token** (short-lived or long-lived)

**Variables:**
- `INSTAGRAM_ACCESS_TOKEN` – long-lived token (60 days, renewable)

**Note:** Personal Instagram accounts can’t use the Graph API. You need an Instagram Business or Creator account linked to a Facebook Page.

---

## 4. LinkedIn

**What it could do:** Show profile summary, experience, or connections count.

**Requirements:**
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
- Create an app
- Most profile data needs **Partner** or **Apply** access

**How to get it:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create an app
3. Request access to products (e.g. Sign In with LinkedIn, Share on LinkedIn)
4. Get **Client ID** and **Client Secret**

**Variables:**
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`

**Note:** Full profile data (experience, education, etc.) usually requires Partner Program approval. For basic profile, the existing LinkedIn badge/embed may be enough.

---

## Summary: What to Provide

| Service    | Variable(s)              | Where to Add        | Complexity |
|-----------|--------------------------|---------------------|------------|
| **GitHub** | `GITHUB_TOKEN`           | `server/.env`, Render | Easy       |
| **YouTube** | `YOUTUBE_API_KEY`       | Backend env         | Medium     |
| **Instagram** | `INSTAGRAM_ACCESS_TOKEN` | Backend env      | Hard (Meta app) |
| **LinkedIn** | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | Backend env | Medium |

---

## Recommended Order

1. **GitHub** – Already wired up. Add `GITHUB_TOKEN` to `server/.env` and Render.
2. **YouTube** – Add if you want channel/playlist data; needs backend route.
3. **LinkedIn** – Current badge may be enough; full API needs app approval.
4. **Instagram** – Only if you have a Business/Creator account and Meta app.

---

## Security Notes

- Never commit `.env` or real API keys to Git
- Use `.env.example` as a template (no real values)
- On Render: set env vars in the dashboard
- Rotate keys if they are exposed
