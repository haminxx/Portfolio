import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001
const GITHUB_USER = process.env.GITHUB_USER || 'haminxx'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github.v3+json',
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
