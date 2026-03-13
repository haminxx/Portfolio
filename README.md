# Portfolio – Chrome-style website

Pre-landing gate (Fn+F11 or Mobile User) and Chrome-browser-style landing page with taskbar, tabs, and system tray.

## Run

- `npm install`
- `npm run dev`

## Customization

- **Chrome window background:** Place your image at `public/background.jpg`. The content area already references this path; if the file is missing, a gray fallback is shown.
- **Profile image:** Edit `ChromeFrame.jsx` and set the profile element’s `src` or background image when you have your asset.
- **Voice AI:** The “Ask Gemini”–style button opens a dropdown with placeholder actions. The pathway is in `src/components/VoiceAIDropdown.jsx` (e.g. `openVoiceAI()`); connect your agent there when ready.

## Build

- `npm run build`
- `npm run preview` to preview the build.
