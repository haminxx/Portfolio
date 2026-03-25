/** Public OSRM demo router — same contract as server /api/maps/route JSON (geometry, duration, distance, steps). */

const OSRM_BASE = 'https://router.project-osrm.org'

const PROFILE = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike',
}

const MAPBOX_PROFILE = {
  driving: 'driving',
  walking: 'walking',
  cycling: 'cycling',
}

/**
 * Mapbox Directions API (client token). Set VITE_MAPBOX_ACCESS_TOKEN in .env.
 * Returns the same shape as fetchOsrmRoutePublic for MapWindow.
 */
export async function fetchMapboxDirections(
  token,
  lat1,
  lon1,
  lat2,
  lon2,
  profile = 'driving',
) {
  const p = MAPBOX_PROFILE[profile] || MAPBOX_PROFILE.driving
  const coords = `${lon1},${lat1};${lon2},${lat2}`
  const url = `https://api.mapbox.com/directions/v5/mapbox/${p}/${coords}?geometries=geojson&overview=full&steps=true&access_token=${encodeURIComponent(token)}`
  const r = await fetch(url)
  if (!r.ok) {
    const errText = await r.text()
    throw new Error(`Mapbox ${r.status} ${errText.slice(0, 80)}`)
  }
  const data = await r.json()
  if (!data.routes?.[0]) {
    throw new Error(data.message || 'No route found')
  }
  const route = data.routes[0]
  const leg = route.legs?.[0]
  return {
    duration: leg?.duration ?? route.duration,
    distance: leg?.distance ?? route.distance,
    geometry: route.geometry,
    steps: (leg?.steps || []).map((s) => ({
      maneuver: s.maneuver?.type,
      name: s.name || '',
      distance: s.distance,
      duration: s.duration,
      instruction:
        s.maneuver?.instruction ||
        [s.maneuver?.type, s.name].filter(Boolean).join(' · ') ||
        '',
    })),
  }
}

export async function fetchOsrmRoutePublic(
  lat1,
  lon1,
  lat2,
  lon2,
  profile = 'driving',
) {
  const osrmProfile = PROFILE[profile] || PROFILE.driving
  const url = `${OSRM_BASE}/route/v1/${osrmProfile}/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`
  const r = await fetch(url)
  if (!r.ok) {
    throw new Error(`OSRM ${r.status}`)
  }
  const data = await r.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(data.message || 'No route found')
  }
  const route = data.routes[0]
  const leg = route.legs?.[0]
  return {
    duration: leg?.duration ?? route.duration,
    distance: leg?.distance ?? route.distance,
    geometry: route.geometry,
    steps: (leg?.steps || []).map((s) => ({
      maneuver: s.maneuver?.type,
      name: s.name || '',
      distance: s.distance,
      duration: s.duration,
      instruction:
        s.maneuver?.instruction ||
        [s.maneuver?.type, s.name].filter(Boolean).join(' · ') ||
        '',
    })),
  }
}
