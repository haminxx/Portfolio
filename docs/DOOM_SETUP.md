# Doom (JS-DOS) Setup

The Doom window uses [js-dos](https://js-dos.com/) to run classic DOOM in the browser.

## Development

In development, a Vite proxy forwards requests to `cdn.dos.zone`, so Doom works without extra setup.

## Production (Firebase)

For production, the Doom bundle must be self-hosted to avoid CORS issues:

1. Download the bundle: [doom.jsdos](https://cdn.dos.zone/custom/dos/doom.jsdos) (use a browser or tool that can bypass CORS for a one-time download)
2. Place it in `public/doom.jsdos`
3. Rebuild and deploy

If `doom.jsdos` is missing, the app shows a fallback card with a link to play on dos.zone.
