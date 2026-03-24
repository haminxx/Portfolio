import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import {
  Home,
  GraduationCap,
  MapPin,
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  Utensils,
  Map,
  ZoomIn,
  ZoomOut,
  X,
  Navigation,
  Car,
  Footprints,
  Bike,
  Train,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import 'leaflet/dist/leaflet.css'
import './MapWindow.css'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const MAP_STYLE_KEYS = {
  minimal: {
    key: 'minimal',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  standard: {
    key: 'standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    key: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  terrain: {
    key: 'terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
}

const PLACES = {
  home: {
    id: 'home',
    nameKey: 'home',
    address: 'Aliso Viejo, CA',
    coords: [33.575, -117.726],
    zoom: 12,
    icon: Home,
  },
  college: {
    id: 'college',
    nameKey: 'college',
    address: 'UC San Diego, 9500 Gilman Dr, La Jolla, CA',
    coords: [32.8801, -117.234],
    zoom: 15,
    icon: GraduationCap,
  },
  chicago: {
    id: 'chicago',
    nameKey: 'homeTown',
    address: 'Chicago, IL',
    coords: [41.8781, -87.6298],
    zoom: 11,
    icon: MapPin,
  },
  seoul: {
    id: 'seoul',
    nameKey: 'secondHomeTown',
    address: 'Seoul, South Korea',
    coords: [37.5665, 126.978],
    zoom: 11,
    icon: Globe,
  },
}

const SPEEDS_MS = { driving: 22, walking: 1.4, cycling: 5 }

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

const homeIcon = L.divIcon({
  className: 'map-window__custom-marker',
  html: '<div class="map-window__pin-outer"><div class="map-window__pin-inner"><span class="map-window__pin-arrow">▲</span></div></div>',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
})

async function geocode(query, limit = 1) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PortfolioMap/1.0',
      },
    }
  )
  const data = await res.json()
  if (!data || !Array.isArray(data)) return limit === 1 ? null : []
  return limit === 1
    ? data[0]
      ? { coords: [parseFloat(data[0].lat), parseFloat(data[0].lon)], address: data[0].display_name }
      : null
    : data.map((d) => ({
        coords: [parseFloat(d.lat), parseFloat(d.lon)],
        address: d.display_name,
      }))
}

function MapFlyTo({ coords, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (coords && coords.length === 2) {
      map.flyTo(coords, zoom ?? 12, { duration: 0.8 })
    }
  }, [coords, zoom, map])
  return null
}

function MapFitRouteBounds({ geometry }) {
  const map = useMap()
  useEffect(() => {
    if (!geometry?.coordinates?.length) return
    try {
      const layer = L.geoJSON(geometry)
      const b = layer.getBounds()
      if (b.isValid()) map.fitBounds(b, { padding: [64, 64], maxZoom: 14 })
    } catch {
      // ignore
    }
  }, [geometry, map])
  return null
}

function MapControls({ mapStyle, onMapStyleChange, t }) {
  const map = useMap()
  return (
    <div className="map-window__controls-strip">
      <div className="map-window__view-dropdown map-window__view-dropdown--animated">
        <Map size={16} strokeWidth={1.5} />
        <select
          value={mapStyle}
          onChange={(e) => onMapStyleChange(e.target.value)}
          className="map-window__view-select"
          aria-label="Map style"
        >
          {Object.entries(MAP_STYLE_KEYS).map(([key, s]) => (
            <option key={key} value={key}>
              {t(`map.${s.key}`)}
            </option>
          ))}
        </select>
        <ChevronDown size={16} strokeWidth={1.5} className="map-window__view-chevron" />
      </div>
      <div className="map-window__zoom-buttons">
        <button type="button" className="map-window__zoom-btn" onClick={() => map.zoomIn()} aria-label="Zoom in">
          <ZoomIn size={16} strokeWidth={1.5} />
        </button>
        <button type="button" className="map-window__zoom-btn" onClick={() => map.zoomOut()} aria-label="Zoom out">
          <ZoomOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export default function MapWindow() {
  const { t } = useLanguage()
  const [activeLocation, setActiveLocation] = useState(null)
  const [restaurantsOpen, setRestaurantsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchCoords, setSearchCoords] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const suggestionsDebounceRef = useRef(null)
  const [mapStyle, setMapStyle] = useState('minimal')
  const [userLocation, setUserLocation] = useState(null)
  const [geoMessage, setGeoMessage] = useState(null)
  const [directionsTarget, setDirectionsTarget] = useState(null)
  const [routeProfile, setRouteProfile] = useState('driving')
  const [routeGeometry, setRouteGeometry] = useState(null)
  const [routeMeta, setRouteMeta] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeHint, setRouteHint] = useState(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoMessage(t('map.locationDenied'))
      return
    }
    setGeoMessage(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude])
        setGeoMessage(null)
      },
      (err) => {
        if (err.code === 1) setGeoMessage(t('map.locationDenied'))
        else setGeoMessage(t('map.routeError'))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }, [t])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const openDirectionsForPlace = useCallback(
    (placeId) => {
      const place = PLACES[placeId]
      if (!place) return
      setActiveLocation(placeId)
      setSearchCoords(null)
      setSearchResult(null)
      setShowSuggestions(false)
      setDirectionsTarget(place)
    },
    []
  )

  const closeDirections = useCallback(() => {
    setDirectionsTarget(null)
    setRouteGeometry(null)
    setRouteMeta(null)
    setRouteHint(null)
  }, [])

  useEffect(() => {
    if (!directionsTarget) {
      setRouteGeometry(null)
      setRouteMeta(null)
      setRouteHint(null)
      return
    }

    const dest = directionsTarget.coords
    const [dlat, dlng] = dest

    if (!userLocation) {
      setRouteGeometry(null)
      setRouteMeta(null)
      setRouteHint(null)
      return
    }

    const [ulat, ulng] = userLocation

    let cancelled = false
    setRouteLoading(true)
    setRouteHint(null)

    const run = async () => {
      if (API_URL) {
        try {
          // Backend uses OpenRouteService when ORS_API_KEY is set, else OSRM. Apple MapKit JS would need a separate dev token and script embed.
          const url = `${API_URL}/api/maps/route?from=${ulat},${ulng}&to=${dlat},${dlng}&profile=${routeProfile}`
          const res = await fetch(url)
          if (cancelled) return
          if (res.ok) {
            const data = await res.json()
            setRouteGeometry(data.geometry || null)
            setRouteMeta({
              duration: data.duration,
              distance: data.distance,
              steps: data.steps || [],
            })
            setRouteHint(null)
            setRouteLoading(false)
            return
          }
        } catch {
          // fall through
        }
      }

      if (cancelled) return
      const meters = haversineMeters(ulat, ulng, dlat, dlng)
      const speed = SPEEDS_MS[routeProfile] || SPEEDS_MS.driving
      const duration = meters / speed
      const geometry = {
        type: 'LineString',
        coordinates: [
          [ulng, ulat],
          [dlng, dlat],
        ],
      }
      setRouteGeometry(geometry)
      setRouteMeta({
        duration,
        distance: meters,
        steps: [],
      })
      setRouteHint(API_URL ? t('map.straightLineHint') : t('map.straightLineHint'))
      setRouteLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [directionsTarget, userLocation, routeProfile, t])

  const flyToCoords = searchCoords ?? (activeLocation && PLACES[activeLocation] ? PLACES[activeLocation].coords : null)
  const flyToZoom = searchCoords ? 14 : activeLocation ? PLACES[activeLocation]?.zoom : null

  const markersToShow = []
  if (activeLocation && !searchCoords && PLACES[activeLocation]) {
    const p = PLACES[activeLocation]
    markersToShow.push({ key: activeLocation, coords: p.coords, address: p.address })
  }
  if (searchCoords) {
    markersToShow.push({
      key: 'search',
      coords: searchCoords,
      address: searchResult?.address ?? 'Searched location',
    })
  }

  const currentStyle = MAP_STYLE_KEYS[mapStyle] ?? MAP_STYLE_KEYS.minimal

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setIsSearching(true)
    setSearchResult(null)
    setShowSuggestions(false)
    try {
      const result = await geocode(q, 1)
      if (result) {
        setSearchCoords(result.coords)
        setSearchResult(result)
        setActiveLocation(null)
        setDirectionsTarget(null)
        setRecentSearches((prev) => {
          const next = [{ query: q, ...result }, ...prev.filter((r) => r.query !== q)].slice(0, 5)
          return next
        })
      }
    } catch {
      setSearchResult(null)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery])

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') handleSearch()
    },
    [handleSearch]
  )

  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current)
    suggestionsDebounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const results = await geocode(q, 5)
        setSuggestions(results || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setSuggestionsLoading(false)
      }
    }, 300)
    return () => {
      if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current)
    }
  }, [searchQuery])

  const selectSuggestion = useCallback((item) => {
    setSearchCoords(item.coords)
    setSearchResult({ address: item.address })
    setSearchQuery(item.address)
    setShowSuggestions(false)
    setSuggestions([])
    setActiveLocation(null)
    setDirectionsTarget(null)
    setRecentSearches((prev) => {
      const next = [{ query: item.address, ...item }, ...prev.filter((r) => r.address !== item.address)].slice(0, 5)
      return next
    })
  }, [])

  const formatDuration = (sec) => {
    if (sec == null || Number.isNaN(sec)) return '—'
    const m = Math.round(sec / 60)
    return `${m} ${t('map.min')}`
  }

  const formatDistance = (meters) => {
    if (meters == null || Number.isNaN(meters)) return '—'
    const mi = meters / 1609.34
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} ${t('map.mi')}`
  }

  return (
    <div className="map-window">
      <div className="map-window__map map-window__map--full-bleed">
        <MapContainer
          center={[33.575, -117.726]}
          zoom={10}
          className="map-window__leaflet"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <MapFlyTo coords={flyToCoords} zoom={flyToZoom} />
          {routeGeometry && <MapFitRouteBounds geometry={routeGeometry} />}
          <TileLayer attribution={currentStyle.attribution} url={currentStyle.url} />
          <MapControls mapStyle={mapStyle} onMapStyleChange={setMapStyle} t={t} />
          {userLocation && (
            <CircleMarker
              center={userLocation}
              radius={7}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#34c759', fillOpacity: 1 }}
            />
          )}
          {routeGeometry && (
            <GeoJSON
              key={`${routeProfile}-${routeGeometry.coordinates?.length}-${routeGeometry.coordinates?.[0]?.join(',')}`}
              data={routeGeometry}
              style={{
                color: '#007aff',
                weight: 5,
                opacity: 0.92,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
          {markersToShow.map((m) => (
            <Marker key={m.key} position={m.coords} icon={homeIcon}>
              <Popup>{m.address}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-window__search-overlay">
        <div className="map-window__search-wrap map-window__search-wrap--relative">
          <Search size={18} strokeWidth={1.5} className="map-window__search-icon" />
          <input
            type="text"
            placeholder={t('map.searchPlaceholder')}
            className="map-window__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
            <div className="map-window__suggestions">
              {suggestionsLoading ? (
                <div className="map-window__suggestion-item map-window__suggestion-item--loading">{t('map.searching')}</div>
              ) : (
                suggestions.map((s, i) => (
                  <button
                    key={`${s.address}-${i}`}
                    type="button"
                    className="map-window__suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectSuggestion(s)
                    }}
                  >
                    {s.address}
                  </button>
                ))
              )}
            </div>
          )}
          <button
            type="button"
            className="map-window__search-btn"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? t('map.searching') : t('map.search')}
          </button>
        </div>
      </div>

      <aside className="map-window__sidebar map-window__sidebar--overlay map-window__sidebar--apple">
        <p className="map-window__sidebar-section-label">{t('map.favorites')}</p>
        {['home', 'college'].map((id) => {
          const loc = PLACES[id]
          const Icon = loc.icon
          return (
            <button
              key={id}
              type="button"
              className={`map-window__saved-item ${activeLocation === id && !searchCoords ? 'map-window__saved-item--active' : ''}`}
              onClick={() => openDirectionsForPlace(id)}
            >
              <Icon size={20} strokeWidth={1.5} />
              <div className="map-window__saved-item-text">
                <span className="map-window__saved-item-name">{t(`map.${loc.nameKey}`)}</span>
                <span className="map-window__saved-item-address">{loc.address}</span>
              </div>
            </button>
          )
        })}
        <p className="map-window__sidebar-sub-label">{t('map.hometowns')}</p>
        {['chicago', 'seoul'].map((id) => {
          const loc = PLACES[id]
          const Icon = loc.icon
          return (
            <button
              key={id}
              type="button"
              className={`map-window__saved-item ${activeLocation === id && !searchCoords ? 'map-window__saved-item--active' : ''}`}
              onClick={() => openDirectionsForPlace(id)}
            >
              <Icon size={20} strokeWidth={1.5} />
              <div className="map-window__saved-item-text">
                <span className="map-window__saved-item-name">{t(`map.${loc.nameKey}`)}</span>
                <span className="map-window__saved-item-address">{loc.address}</span>
              </div>
            </button>
          )
        })}

        <div className="map-window__folder map-window__folder--restaurants">
          <button
            type="button"
            className="map-window__folder-header"
            onClick={() => setRestaurantsOpen((o) => !o)}
          >
            {restaurantsOpen ? (
              <ChevronDown size={18} strokeWidth={1.5} />
            ) : (
              <ChevronRight size={18} strokeWidth={1.5} />
            )}
            <Utensils size={18} strokeWidth={1.5} />
            <span className="map-window__folder-label">{t('map.restaurantsAndCafe')}</span>
          </button>
          {restaurantsOpen && (
            <div className="map-window__folder-items">
              <div className="map-window__folder-empty">{t('map.restaurantsPlaceholder')}</div>
            </div>
          )}
        </div>

        {recentSearches.length > 0 && (
          <>
            <h3 className="map-window__sidebar-title map-window__sidebar-title--mt">{t('map.recentSearches')}</h3>
            {recentSearches.map((r, i) => (
              <button
                key={`${r.query}-${i}`}
                type="button"
                className="map-window__saved-item"
                onClick={() => {
                  setSearchCoords(r.coords)
                  setSearchResult(r)
                  setActiveLocation(null)
                  setDirectionsTarget(null)
                }}
              >
                <MapPin size={20} strokeWidth={1.5} />
                <div className="map-window__saved-item-text">
                  <span className="map-window__saved-item-name">{r.query}</span>
                  <span className="map-window__saved-item-address">{r.address}</span>
                </div>
              </button>
            ))}
          </>
        )}
      </aside>

      {directionsTarget && (
        <div className="map-window__directions-card">
          <div className="map-window__directions-header">
            <Navigation size={20} strokeWidth={1.5} className="map-window__directions-header-icon" />
            <h2 className="map-window__directions-title">{t('map.directions')}</h2>
            <button type="button" className="map-window__directions-close" onClick={closeDirections} aria-label={t('map.closePanel')}>
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="map-window__directions-modes">
            <button
              type="button"
              className={`map-window__mode-btn ${routeProfile === 'driving' ? 'map-window__mode-btn--active' : ''}`}
              onClick={() => setRouteProfile('driving')}
              aria-pressed={routeProfile === 'driving'}
            >
              <Car size={18} strokeWidth={1.5} />
              <span>{t('map.driving')}</span>
            </button>
            <button
              type="button"
              className={`map-window__mode-btn ${routeProfile === 'walking' ? 'map-window__mode-btn--active' : ''}`}
              onClick={() => setRouteProfile('walking')}
              aria-pressed={routeProfile === 'walking'}
            >
              <Footprints size={18} strokeWidth={1.5} />
              <span>{t('map.walking')}</span>
            </button>
            <button
              type="button"
              className={`map-window__mode-btn ${routeProfile === 'cycling' ? 'map-window__mode-btn--active' : ''}`}
              onClick={() => setRouteProfile('cycling')}
              aria-pressed={routeProfile === 'cycling'}
            >
              <Bike size={18} strokeWidth={1.5} />
              <span>{t('map.cycling')}</span>
            </button>
            <button type="button" className="map-window__mode-btn map-window__mode-btn--disabled" disabled title={t('map.transitSoon')}>
              <Train size={18} strokeWidth={1.5} />
              <span>{t('map.transitSoon')}</span>
            </button>
          </div>

          <div className="map-window__directions-places">
            <div className="map-window__directions-row">
              <span className="map-window__directions-label">{t('map.yourLocation')}</span>
              <span className="map-window__directions-value">
                {userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : '—'}
              </span>
            </div>
            {!userLocation && (
              <div className="map-window__directions-alert">
                <p>{t('map.locationNeeded')}</p>
                <button type="button" className="map-window__directions-loc-btn" onClick={requestLocation}>
                  {t('map.search')}
                </button>
              </div>
            )}
            {geoMessage && <p className="map-window__directions-warn">{geoMessage}</p>}
            <div className="map-window__directions-row map-window__directions-row--dest">
              <span className="map-window__directions-label">{t('map.to')}</span>
              <span className="map-window__directions-value map-window__directions-value--strong">{t(`map.${directionsTarget.nameKey}`)}</span>
              <span className="map-window__directions-address">{directionsTarget.address}</span>
            </div>
          </div>

          {userLocation && (
            <div className="map-window__directions-summary">
              {routeLoading ? (
                <p className="map-window__directions-loading">{t('map.searching')}</p>
              ) : routeMeta ? (
                <>
                  <div className="map-window__directions-summary-main">
                    <span className="map-window__directions-eta">{formatDuration(routeMeta.duration)}</span>
                    <span className="map-window__directions-dot">·</span>
                    <span className="map-window__directions-dist">{formatDistance(routeMeta.distance)}</span>
                  </div>
                  {routeHint && <p className="map-window__directions-hint">{routeHint}</p>}
                  {routeMeta.steps?.length > 0 && (
                    <ol className="map-window__directions-steps">
                      {routeMeta.steps.slice(0, 12).map((step, i) => (
                        <li key={i} className="map-window__directions-step">
                          {step.name || step.maneuver || '—'}
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
