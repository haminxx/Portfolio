# Portfolio – Chrome-style website

Pre-landing gate (Fn+F11 or Mobile User) and Chrome-browser-style landing page with taskbar, tabs, and system tray.

## Run

- `npm install`
- `npm run dev`

## API Keys

For GitHub, YouTube, Instagram, and LinkedIn integrations, see [docs/API_KEYS_SETUP.md](docs/API_KEYS_SETUP.md) for setup instructions and where to add your keys.

## Customization

- **Chrome window background:** Place your image at `public/background.jpg`. The content area already references this path; if the file is missing, a gray fallback is shown.
- **Profile image:** Edit `ChromeFrame.jsx` and set the profile element’s `src` or background image when you have your asset.
- **Voice AI:** The “Ask Gemini”–style button opens a dropdown with placeholder actions. The pathway is in `src/components/VoiceAIDropdown.jsx` (e.g. `openVoiceAI()`); connect your agent there when ready.

## Build

- `npm run build`
- `npm run preview` to preview the build.

## Firebase Hosting

The project is set up for Firebase Hosting (build output: `dist`, SPA rewrites for React Router).

1. **Log in to Firebase** (opens browser; use your Google account):
   ```bash
   npx firebase-tools login
   ```
2. **Link your Firebase project** (use the project ID from [Firebase Console](https://console.firebase.google.com)):
   ```bash
   npx firebase-tools use your-firebase-project-id
   ```
   Or create a new project in the console, then run the same command with that project ID. Update `.firebaserc` if you prefer editing the file: set `"default"` to your project ID.
3. **Add your custom domain** in Firebase Console: Hosting → Add custom domain, then follow the DNS steps.
4. **Deploy**:
   ```bash
   npm run deploy
   ```
   This builds the app and deploys to Firebase Hosting.

### Hosting storage (Spark / free tier)

Release retention is **not** configured in `firebase.json` (Firebase stores it on each **channel**; the CLI does not apply a `retainedReleases` field from that file). To cap how many old deploys are kept and reduce storage use:

1. [Firebase Console](https://console.firebase.google.com) → your project → **Build** → **Hosting** → select your site.
2. In **Release history**, open the menu (**⋮**) → **Release storage settings**.
3. Set **releases to keep** to **2** (or another small number) and save. Older releases are scheduled for deletion, oldest first.

If **`npm run deploy`** fails with **HTTP 429** (*Hosting storage quota exceeded*), delete older releases manually from the same Release history (you cannot delete the release currently serving live), wait a few minutes, then deploy again.

### Optional: smaller bundles

Hosting quota is driven mainly by **how many release snapshots** you retain, not only one build’s size. To inspect chunk sizes locally: `npx vite-bundle-visualizer` (or add a Rollup visualizer plugin) and consider lazy-loading heavy routes.
