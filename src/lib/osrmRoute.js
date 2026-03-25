/** Public OSRM demo router — same contract as server /api/maps/route JSON (geometry, duration, distance, steps). */

const OSRM_BASE = 'https://router.project-osrm.org'

const PROFILE = {
  driving: 'driving',
  walking: 'foot',
  cycling: 'bike',
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
      instruction: s.maneuver?.instruction,
    })),
  }
}
