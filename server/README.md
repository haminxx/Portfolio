# GitHub API Server

Backend for fetching GitHub profile data. Deploy to Render or run locally.

## Local Setup

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Edit `.env` and add your GitHub token (optional, increases rate limit):
   ```
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_USER=haminxx
   PORT=3001
   ```

3. Install and run:
   ```
   npm install
   npm start
   ```

4. In the project root, create `.env` with:
   ```
   VITE_API_URL=http://localhost:3001
   ```

5. Run the frontend: `npm run dev`

## Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set root directory to `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables: `GITHUB_TOKEN`, `GITHUB_USER`
7. After deploy, set `VITE_API_URL=https://your-service.onrender.com` when building the frontend

## Maps directions proxy

`GET /api/maps/route?from=LAT,LON&to=LAT,LON&profile=driving|walking|cycling` returns a GeoJSON line and step list for the Map app. If `ORS_API_KEY` is set (OpenRouteService free tier), the server uses ORS first for road-following routes; otherwise it proxies to the public OSRM demo or your `OSRM_BASE_URL` instance. This avoids browser CORS against third-party routing APIs.

The static frontend also calls the public OSRM endpoint directly when `VITE_API_URL` is unset so routes follow roads in production without this server.

**Apple MapKit JS:** Web routing with Apple’s stack requires a developer account, domain allowlisting, and server-issued JWTs for MapKit; it is not a drop-in replacement for the Leaflet + OSRM/ORS pipeline above. Road geometry from OSRM/OpenRouteService matches typical “follow the road” map UX.
