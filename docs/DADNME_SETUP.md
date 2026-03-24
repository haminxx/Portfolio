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

This repo may vendor `public/dadnme.swf` from a third-party GitHub Pages mirror for local Ruffle playback only—for example the file linked as `SWF/DAD n' ME.swf` in [ArdorAchord/ArdorAchord.github.io](https://github.com/ArdorAchord/ArdorAchord.github.io) (raw: `https://raw.githubusercontent.com/ArdorAchord/ArdorAchord.github.io/master/SWF/DAD%20n%27%20ME.swf`). **You are responsible for complying with copyright** when hosting or redistributing the game.

## After Adding the File

1. Restart the dev server if running: `npm run dev`
2. Redeploy: `npm run deploy`

## Firebase Headers

The project configures Firebase Hosting to serve SWF files with the correct `Content-Type: application/x-shockwave-flash` header. This is set in `firebase.json`.

## Troubleshooting

- **"Not a valid swf"**: Often means the server returned **HTML** (for example your SPA `index.html`) instead of binary SWF—common when `public/dadnme.swf` was never added or not copied into `dist/`. Firebase Hosting serves static files from `dist/` when they exist; otherwise the catch-all rewrite sends `index.html`. Verify the file exists at `public/dadnme.swf`, run `npm run build`, and confirm `dist/dadnme.swf` is present before deploy. The file must also be a valid Flash SWF, not corrupted or renamed.
- **404**: The file is not in the correct location. Ensure it is in `public/` (not `src/` or `assets/`).
- **Fallback**: If the SWF fails to load, the app shows "Retry" and "Play on FlashLegacy" buttons to play on an external site.
