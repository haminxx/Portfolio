/**
 * Dynamic Apple MapKit JS loader.
 * Maps ID: maps.me.christianjameslee
 * Injects the script tag on first call, initialises with the JWT token,
 * and returns a promise that resolves to `true` (MapKit ready) or `false`.
 */

const MAPKIT_URL = 'https://cdn.apple-mapkit.com/mk/5/mapkit.js'

let pending = null

export function loadMapKit(token) {
  if (!token) return Promise.resolve(false)
  if (window.mapkit?.maps) return Promise.resolve(true)

  if (!pending) {
    pending = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = MAPKIT_URL
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        try {
          window.mapkit.init({
            authorizationCallback: (done) => done(token),
          })
          resolve(true)
        } catch {
          resolve(false)
        }
      }
      script.onerror = () => resolve(false)
      document.head.appendChild(script)
    })
  }

  return pending
}
