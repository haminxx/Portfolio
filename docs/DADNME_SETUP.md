# Dad 'n Me SWF Setup

## Where to Place the File

Place your `dadnme.swf` file in:

```
public/dadnme.swf
```

This is the root `public` folder of the project (same level as `index.html`). Files in `public/` are served at the site root, so the SWF will be available at:

- **Development:** `http://localhost:5173/dadnme.swf`
- **Production:** `https://portfolio-cnl.web.app/dadnme.swf`

## Project Structure

```
Personal Portfolio Website/
├── public/
│   ├── dadnme.swf    <-- Place the file here
│   ├── index.html
│   └── ...
├── src/
│   └── ...
└── ...
```

## Obtaining the SWF

The game is by The Behemoth. If you have a license, you may be able to obtain the SWF from their official sources. Ensure the file is a valid Adobe Flash SWF (not a renamed image or corrupted download).

## After Adding the File

1. Restart the dev server if running: `npm run dev`
2. Redeploy: `npm run deploy`

## Firebase Headers

The project configures Firebase Hosting to serve SWF files with the correct `Content-Type: application/x-shockwave-flash` header. This is set in `firebase.json`.

## Troubleshooting

- **"Not a valid swf"**: The file may be missing, corrupted, or not a valid SWF. Verify the file exists at `public/dadnme.swf` and is a proper Flash SWF. Vite copies `public/` to `dist/` during build, so the file must be in `public/` before running `npm run build`.
- **404**: The file is not in the correct location. Ensure it is in `public/` (not `src/` or `assets/`).
- **Fallback**: If the SWF fails to load, the app shows "Retry" and "Play on FlashLegacy" buttons to play on an external site.
