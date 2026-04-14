# Portfolio API server

Backend for YouTube Music search, maps routing proxy, and other API routes. Deploy to Render or run locally.

## Local setup

1. Copy `.env.example` to `.env` in this folder.
2. Install and run:
   ```
   npm install
   npm start
   ```
3. In the project root, set `VITE_API_URL=http://localhost:3001` if the frontend should use this server.
4. Run the frontend from the repo root: `npm run dev`

## Deploy to Render

1. Create a Web Service on Render
2. Set root directory to `server`
3. Build: `npm install` — Start: `npm start`
4. Add env vars from `.env.example` as needed (`YOUTUBE_API_KEY`, `ORS_API_KEY`, etc.)
5. Set `VITE_API_URL=https://your-service.onrender.com` when building the frontend

## Maps directions proxy

`GET /api/maps/route?from=LAT,LON&to=LAT,LON&profile=driving|walking|cycling` returns GeoJSON and steps for the Map app. With `ORS_API_KEY`, OpenRouteService is preferred; otherwise OSRM or `OSRM_BASE_URL` is used.
