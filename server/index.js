import express from 'express'
import cors from 'cors'
import YTMusic from 'ytmusic-api'
import { CURATED_SECTIONS } from './ytmusic-curated.js'

const app = express()
let ytmusic = null

async function getYTMusic() {
  if (!ytmusic) {
    ytmusic = new YTMusic()
    await ytmusic.initialize()
  }
  return ytmusic
}
const PORT = process.env.PORT || 3001
const GITHUB_USER = process.env.GITHUB_USER || 'haminxx'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
}

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://portfolio-cnl.web.app',
    'https://christianjameslee.me',
  ],
}))

app.get('/api/github', async (req, res) => {
  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers: GITHUB_HEADERS }),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=3`, { headers: GITHUB_HEADERS }),
    ])

    if (!profileRes.ok) {
      return res.status(profileRes.status).json({ error: 'Failed to fetch profile' })
    }

    const profile = await profileRes.json()
    const repos = reposRes.ok ? await reposRes.json() : []

    const payload = {
      avatar_url: profile.avatar_url,
      login: profile.login,
      name: profile.name || profile.login,
      bio: profile.bio || null,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      html_url: profile.html_url,
      repos: repos.map((r) => ({
        name: r.name,
        html_url: r.html_url,
        description: r.description || null,
      })),
    }

    res.json(payload)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch GitHub data' })
  }
})

function mapSearchItem(item) {
  const name = item.name ?? item.title ?? 'Unknown'
  const artist = item.artist?.name ?? item.artists?.[0]?.name ?? item.author ?? 'Unknown'
  const thumbnails = item.thumbnails ?? []
  const thumbnail = thumbnails[0]?.url ?? null
  let url = null
  if (item.videoId) url = `https://music.youtube.com/watch?v=${item.videoId}`
  else if (item.albumId) url = `https://music.youtube.com/album/${item.albumId}`
  else if (item.playlistId) url = `https://music.youtube.com/playlist?list=${item.playlistId}`
  else if (item.artistId) url = `https://music.youtube.com/channel/${item.artistId}`
  return { title: name, artist, thumbnail, url }
}

app.get('/api/ytmusic/search', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' })
  }
  try {
    const yt = await getYTMusic()
    const results = await yt.search(q)
    const items = (Array.isArray(results) ? results : []).slice(0, 20).map(mapSearchItem)
    res.json({ items })
  } catch (err) {
    console.error('YTMusic search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

app.get('/api/ytmusic/curated', (req, res) => {
  res.json({ sections: CURATED_SECTIONS })
})

app.get('/api/youtube/search', async (req, res) => {
  const q = req.query.q?.trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' })
  }
  if (!YOUTUBE_API_KEY) {
    return res.status(503).json({ error: 'YouTube API key not configured' })
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=20&key=${YOUTUBE_API_KEY}`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.error) {
      return res.status(400).json({ error: data.error.message || 'YouTube API error' })
    }
    const items = (data.items || []).map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
    })).filter((i) => i.id)
    res.json({ items })
  } catch (err) {
    console.error('YouTube search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
