import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Search,
  MapPin,
  X,
  Plus,
  Minus,
  Locate,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Car,
  Footprints,
  Bus,
  Clock,
  Compass,
  UtensilsCrossed,
  Fuel,
  Coffee,
  ShoppingCart,
  ShoppingBag,
  Hotel,
  Phone,
  Globe,
  Share2,
  Bike,
} from 'lucide-react'
import { loadMapKit } from '../lib/mapkitLoader'
import { useLanguage } from '../context/LanguageContext'
import './MapWindow.css'

/* ── Env ── */
const MAPKIT_TOKEN = (import.meta.env.VITE_MAPKIT_TOKEN || '').trim()
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

/* ── Recents ── */
const RECENTS_KEY = 'map-recents'
function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || [] } catch { return [] }
}
function saveRecent(place) {
  const list = loadRecents().filter((r) => r.name !== place.name)
  const next = [place, ...list].slice(0, 8)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  return next
}

/* ── Geocode fallback (Nominatim) ── */
async function geocodeNominatim(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'PortfolioMap/1.0' } },
  )
  const data = await res.json()
  if (!Array.isArray(data)) return []
  return data.map((d) => ({
    name: d.display_name.split(',')[0],
    address: d.display_name,
    lng: parseFloat(d.lon),
    lat: parseFloat(d.lat),
  }))
}

/* ── Route fallback (OSRM) ── */
async function routeOSRM(fromLat, fromLng, toLat, toLng, profile = 'driving') {
  const osrmProfile = profile === 'walking' ? 'foot' : profile === 'cycling' ? 'bicycle' : 'car'
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) return null
  const route = data.routes[0]
  return {
    coords: route.geometry.coordinates,
    distance: route.distance,
    duration: route.duration,
    steps: route.legs?.[0]?.steps?.map((s) => s.maneuver?.instruction || s.name).filter(Boolean) || [],
  }
}

/* ── Explore Nearby categories ── */
const CATEGORIES = [
  { id: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed, color: '#FF6B35' },
  { id: 'gas stations', label: 'Gas', icon: Fuel, color: '#007AFF' },
  { id: 'coffee', label: 'Coffee', icon: Coffee, color: '#A0522D' },
  { id: 'groceries', label: 'Groceries', icon: ShoppingCart, color: '#34C759' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#FF2D55' },
  { id: 'hotels', label: 'Hotels', icon: Hotel, color: '#AF52DE' },
]

/* ════════════════════════════════════════════ */
export default function MapWindow() {
  const { t } = useLanguage()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const engineRef = useRef('libre')
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)

  /* ── UI state ── */
  const [tab, setTab] = useState('search')
  const [panel, setPanel] = useState('main')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [recents, setRecents] = useState(loadRecents)

  /* directions */
  const [dirFrom, setDirFrom] = useState('')
  const [dirTo, setDirTo] = useState('')
  const [dirProfile, setDirProfile] = useState('driving')
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)

  /* ── Map helpers ── */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove?.() || m.map?.removeAnnotation?.(m))
    markersRef.current = []
  }, [])

  const clearRoute = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (engineRef.current === 'libre') {
      if (map.getSource?.('route')) {
        try { map.removeLayer('route-line'); map.removeSource('route') } catch { /* ok */ }
      }
    } else if (routeLayerRef.current) {
      map.removeOverlay?.(routeLayerRef.current)
      routeLayerRef.current = null
    }
  }, [])

  const flyTo = useCallback((lng, lat, zoom = 14) => {
    const map = mapRef.current
    if (!map) return
    if (engineRef.current === 'libre') {
      map.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true })
    } else {
      map.setCenterAnimated(new window.mapkit.Coordinate(lat, lng))
    }
  }, [])

  const addMarker = useCallback((lng, lat, title) => {
    const map = mapRef.current
    if (!map) return
    if (engineRef.current === 'libre') {
      const el = document.createElement('div')
      el.className = 'mw-marker'
      const m = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
      markersRef.current.push(m)
    } else {
      const mk = window.mapkit
      const ann = new mk.MarkerAnnotation(new mk.Coordinate(lat, lng), { title, color: '#007AFF' })
      map.addAnnotation(ann)
      markersRef.current.push(ann)
    }
  }, [])

  const drawRoute = useCallback((coords) => {
    const map = mapRef.current
    if (!map || !coords?.length) return
    clearRoute()
    if (engineRef.current === 'libre') {
      if (!map.isStyleLoaded?.()) return
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } })
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#007AFF', 'line-width': 4, 'line-opacity': 0.85 }, layout: { 'line-cap': 'round', 'line-join': 'round' } })
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]))
      map.fitBounds(bounds, { padding: 60, duration: 800 })
    } else {
      const mk = window.mapkit
      const style = new mk.Style({ lineWidth: 5, strokeColor: '#007AFF', strokeOpacity: 0.85 })
      const points = coords.map(([lng, lat]) => new mk.Coordinate(lat, lng))
      const overlay = new mk.PolylineOverlay(points, { style })
      map.addOverlay(overlay)
      routeLayerRef.current = overlay
      map.showItems([overlay])
    }
  }, [clearRoute])

  /* ── Init map engine ── */
  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    ;(async () => {
      const mapkitReady = MAPKIT_TOKEN ? await loadMapKit(MAPKIT_TOKEN) : false

      if (cancelled) return

      if (mapkitReady && window.mapkit) {
        engineRef.current = 'mapkit'
        const mk = window.mapkit
        const map = new mk.Map(containerRef.current, {
          center: new mk.Coordinate(33.575, -117.726),
          colorScheme: mk.Map.ColorSchemes.Dark,
          mapType: mk.Map.MapTypes.Standard,
          showsCompass: mk.FeatureVisibility.Hidden,
          showsMapTypeControl: false,
          showsZoomControl: false,
          padding: new mk.Padding(0, 0, 0, 0),
        })
        mapRef.current = map
      } else {
        engineRef.current = 'libre'
        const map = new maplibregl.Map({
          container: containerRef.current,
          style: DARK_STYLE,
          center: [-117.726, 33.575],
          zoom: 10,
          attributionControl: false,
          fadeDuration: 0,
        })
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left')
        mapRef.current = map
      }
    })()

    return () => {
      cancelled = true
      if (mapRef.current) {
        if (engineRef.current === 'libre') mapRef.current.remove()
        else mapRef.current.destroy?.()
        mapRef.current = null
      }
    }
  }, [])

  /* ── Search ── */
  const handleSearch = useCallback(async (overrideQuery) => {
    const q = (typeof overrideQuery === 'string' ? overrideQuery : query).trim()
    if (!q) return
    setSearching(true)
    setTab('search')
    setPanel('results')

    try {
      if (engineRef.current === 'mapkit' && window.mapkit) {
        const search = new window.mapkit.Search()
        const data = await new Promise((resolve) => {
          search.search(q, (err, resp) => {
            if (err || !resp?.places) { resolve([]); return }
            resolve(resp.places.map((p) => ({
              name: p.name,
              address: p.formattedAddress || '',
              lat: p.coordinate.latitude,
              lng: p.coordinate.longitude,
              phone: p.telephone || '',
              url: p.urls?.[0] || '',
            })))
          })
        })
        setResults(data)
      } else {
        const data = await geocodeNominatim(q)
        setResults(data)
      }
    } catch {
      setResults([])
    }
    setSearching(false)
  }, [query])

  /* ── Category search ── */
  const handleCategorySearch = useCallback((categoryId) => {
    setQuery(categoryId)
    handleSearch(categoryId)
  }, [handleSearch])

  /* ── Select place ── */
  const selectPlace = useCallback((place) => {
    setSelected(place)
    setPanel('detail')
    clearMarkers()
    flyTo(place.lng, place.lat, 15)
    addMarker(place.lng, place.lat, place.name)
    setRecents(saveRecent(place))
  }, [flyTo, addMarker, clearMarkers])

  /* ── Directions ── */
  const handleDirections = useCallback(async () => {
    if (!dirFrom.trim() || !dirTo.trim()) return
    setRouteLoading(true)
    setRoute(null)
    clearMarkers()
    clearRoute()

    try {
      let fromCoord, toCoord
      if (dirFrom.toLowerCase() === 'my location') {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(
            (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
            rej, { enableHighAccuracy: true, timeout: 8000 },
          ),
        )
        fromCoord = pos
      } else {
        const r = await geocodeNominatim(dirFrom)
        if (r[0]) fromCoord = r[0]
      }
      const toResults = await geocodeNominatim(dirTo)
      if (toResults[0]) toCoord = toResults[0]

      if (!fromCoord || !toCoord) { setRouteLoading(false); return }

      addMarker(fromCoord.lng, fromCoord.lat, 'Start')
      addMarker(toCoord.lng, toCoord.lat, 'End')

      if (engineRef.current === 'mapkit' && window.mapkit) {
        const mk = window.mapkit
        const dirs = new mk.Directions()
        const transportType = dirProfile === 'walking' ? mk.Directions.Transport.Walking
          : dirProfile === 'transit' ? mk.Directions.Transport.Automobile
          : mk.Directions.Transport.Automobile
        const request = {
          origin: new mk.Coordinate(fromCoord.lat, fromCoord.lng),
          destination: new mk.Coordinate(toCoord.lat, toCoord.lng),
          transportType,
        }
        const data = await new Promise((resolve) => {
          dirs.route(request, (err, resp) => {
            if (err || !resp?.routes?.[0]) { resolve(null); return }
            const r = resp.routes[0]
            resolve({
              distance: r.distance,
              duration: r.expectedTravelTime,
              steps: r.steps?.map((s) => s.instructions).filter(Boolean) || [],
              coords: r.polyline?.points?.map((p) => [p.longitude, p.latitude]) || [],
            })
          })
        })
        if (data) { setRoute(data); drawRoute(data.coords) }
      } else {
        const data = await routeOSRM(fromCoord.lat, fromCoord.lng, toCoord.lat, toCoord.lng, dirProfile)
        if (data) { setRoute(data); drawRoute(data.coords) }
      }
    } catch { /* ignore */ }
    setRouteLoading(false)
  }, [dirFrom, dirTo, dirProfile, clearMarkers, clearRoute, addMarker, drawRoute])

  /* ── Start directions from detail ── */
  const startDirectionsFromPlace = useCallback(() => {
    if (!selected) return
    setDirFrom('My location')
    setDirTo(selected.address || selected.name)
    setTab('directions')
    setPanel('main')
  }, [selected])

  /* ── Back to main ── */
  const backToMain = useCallback(() => {
    setPanel('main')
    setResults([])
    setSelected(null)
    clearMarkers()
    clearRoute()
    setRoute(null)
  }, [clearMarkers, clearRoute])

  /* ── Locate ── */
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => flyTo(pos.coords.longitude, pos.coords.latitude, 14),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [flyTo])

  /* ── Zoom ── */
  const zoomIn = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (engineRef.current === 'libre') map.zoomIn()
  }, [])

  const zoomOut = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (engineRef.current === 'libre') map.zoomOut()
  }, [])

  /* ── Format helpers ── */
  const fmtDist = (m) => { if (!m) return ''; const mi = m / 1609.34; return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi` }
  const fmtTime = (s) => { if (!s) return ''; const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr ${m % 60} min` }

  /* ════════════════════════════ Render ════════════════════════════ */
  return (
    <div className="mw">
      {/* Full map canvas */}
      <div ref={containerRef} className="mw__canvas" />

      {/* ── Sidebar (docked left, matches maps.apple.com) ── */}
      <aside className="mw__sidebar">
        {/* Brand header */}
        <div className="mw__nav-header">
          <span className="mw__brand">Maps</span>
        </div>

        {/* Tab bar */}
        <div className="mw__tabs">
          {[
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'guides', icon: Compass, label: 'Guides' },
            { id: 'directions', icon: Navigation, label: 'Directions' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              className={`mw__tab${tab === id ? ' mw__tab--active' : ''}`}
              onClick={() => { setTab(id); setPanel('main') }}
            >
              <Icon size={16} strokeWidth={1.75} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="mw__tabs-sep" />

        {/* Scrollable content */}
        <div className="mw__content">

          {/* ═══ Search tab: main ═══ */}
          {tab === 'search' && panel === 'main' && (
            <>
              <div className="mw__search-bar">
                <Search size={15} strokeWidth={2} className="mw__search-ico" />
                <input
                  type="text"
                  className="mw__search-input"
                  placeholder={t('map.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {query && (
                  <button type="button" className="mw__clear-btn" onClick={() => setQuery('')}>
                    <X size={11} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Explore Nearby */}
              <div className="mw__explore">
                <p className="mw__section-title">Explore Nearby</p>
                <div className="mw__categories">
                  {CATEGORIES.map(({ id, label, icon: CatIcon, color }) => (
                    <button
                      key={id}
                      type="button"
                      className="mw__category"
                      onClick={() => handleCategorySearch(id)}
                    >
                      <div className="mw__category-icon" style={{ background: color }}>
                        <CatIcon size={18} strokeWidth={1.75} />
                      </div>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recents */}
              {recents.length > 0 && (
                <div className="mw__section">
                  <p className="mw__section-title">Recents</p>
                  {recents.map((r, i) => (
                    <button key={i} type="button" className="mw__place-row" onClick={() => selectPlace(r)}>
                      <Clock size={14} strokeWidth={1.75} className="mw__row-ico" />
                      <div className="mw__row-info">
                        <span className="mw__row-name">{r.name}</span>
                        <span className="mw__row-addr">{r.address}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ Search tab: results ═══ */}
          {tab === 'search' && panel === 'results' && (
            <div className="mw__panel-slide">
              <button type="button" className="mw__back" onClick={backToMain}>
                <ChevronLeft size={18} strokeWidth={2} />
                <span>Search</span>
              </button>
              <p className="mw__section-title">{searching ? 'Searching\u2026' : `${results.length} Results`}</p>
              {results.map((r, i) => (
                <button key={i} type="button" className="mw__place-row" onClick={() => selectPlace(r)}>
                  <MapPin size={14} strokeWidth={1.75} className="mw__row-ico" />
                  <div className="mw__row-info">
                    <span className="mw__row-name">{r.name}</span>
                    <span className="mw__row-addr">{r.address}</span>
                  </div>
                  <ChevronRight size={14} className="mw__row-chevron" />
                </button>
              ))}
              {!searching && results.length === 0 && (
                <p className="mw__empty">No results found.</p>
              )}
            </div>
          )}

          {/* ═══ Search tab: place detail ═══ */}
          {tab === 'search' && panel === 'detail' && selected && (
            <div className="mw__panel-slide">
              <button type="button" className="mw__back" onClick={backToMain}>
                <ChevronLeft size={18} strokeWidth={2} />
                <span>Search</span>
              </button>
              <div className="mw__detail">
                <h2 className="mw__detail-name">{selected.name}</h2>
                <p className="mw__detail-addr">{selected.address}</p>

                {/* Action buttons */}
                <div className="mw__actions">
                  <button type="button" className="mw__action mw__action--primary" onClick={startDirectionsFromPlace}>
                    <div className="mw__action-icon">
                      <Navigation size={18} strokeWidth={2} />
                    </div>
                    <span>Directions</span>
                  </button>
                  {selected.phone && (
                    <button type="button" className="mw__action" onClick={() => window.open(`tel:${selected.phone}`)}>
                      <div className="mw__action-icon">
                        <Phone size={18} strokeWidth={2} />
                      </div>
                      <span>Call</span>
                    </button>
                  )}
                  {selected.url && (
                    <button type="button" className="mw__action" onClick={() => window.open(selected.url, '_blank')}>
                      <div className="mw__action-icon">
                        <Globe size={18} strokeWidth={2} />
                      </div>
                      <span>Website</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="mw__action"
                    onClick={() => {
                      try { navigator.share?.({ title: selected.name, text: selected.address }) } catch { /* ok */ }
                    }}
                  >
                    <div className="mw__action-icon">
                      <Share2 size={18} strokeWidth={2} />
                    </div>
                    <span>Share</span>
                  </button>
                </div>

                {selected.phone && <p className="mw__detail-meta">{selected.phone}</p>}
              </div>
            </div>
          )}

          {/* ═══ Guides tab ═══ */}
          {tab === 'guides' && (
            <>
              <p className="mw__section-title" style={{ marginTop: 4 }}>Guides</p>
              <p className="mw__empty">Curated guides coming soon.</p>
            </>
          )}

          {/* ═══ Directions tab ═══ */}
          {tab === 'directions' && (
            <>
              <div className="mw__dir-inputs">
                <div className="mw__dir-field">
                  <span className="mw__dir-dot mw__dir-dot--from" />
                  <input
                    type="text"
                    className="mw__dir-input"
                    placeholder="From (or 'My location')"
                    value={dirFrom}
                    onChange={(e) => setDirFrom(e.target.value)}
                  />
                </div>
                <div className="mw__dir-field">
                  <span className="mw__dir-dot mw__dir-dot--to" />
                  <input
                    type="text"
                    className="mw__dir-input"
                    placeholder="To"
                    value={dirTo}
                    onChange={(e) => setDirTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="mw__modes">
                {[
                  { id: 'driving', icon: Car, label: 'Drive' },
                  { id: 'walking', icon: Footprints, label: 'Walk' },
                  { id: 'transit', icon: Bus, label: 'Transit' },
                  { id: 'cycling', icon: Bike, label: 'Cycle' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`mw__mode${dirProfile === id ? ' mw__mode--active' : ''}`}
                    onClick={() => setDirProfile(id)}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mw__go-btn"
                onClick={handleDirections}
                disabled={routeLoading || !dirFrom.trim() || !dirTo.trim()}
              >
                {routeLoading ? 'Routing\u2026' : 'Get Directions'}
              </button>

              {route && (
                <div className="mw__route">
                  <div className="mw__route-summary">
                    <span className="mw__route-time">{fmtTime(route.duration)}</span>
                    <span className="mw__route-dist">{fmtDist(route.distance)}</span>
                  </div>
                  {route.steps.length > 0 && (
                    <ol className="mw__route-steps">
                      {route.steps.slice(0, 15).map((s, i) => (
                        <li key={i} className="mw__route-step">{s}</li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ── Map controls (top-right, matching maps.apple.com) ── */}
      <div className="mw__controls">
        <button type="button" className="mw__ctrl-btn" aria-label="Compass">
          <Compass size={16} strokeWidth={1.75} />
        </button>
        <div className="mw__ctrl-sep" />
        <button type="button" className="mw__ctrl-btn" onClick={zoomIn} aria-label="Zoom in">
          <Plus size={16} strokeWidth={2} />
        </button>
        <div className="mw__ctrl-sep" />
        <button type="button" className="mw__ctrl-btn" onClick={zoomOut} aria-label="Zoom out">
          <Minus size={16} strokeWidth={2} />
        </button>
      </div>

      <button type="button" className="mw__locate-btn" onClick={locateUser} aria-label="My location">
        <Locate size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
