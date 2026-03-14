import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
if (typeof window !== 'undefined') window.L = L
import 'leaflet.heat'
import { Home, GraduationCap, MapPin, Globe, Search, ChevronDown, ChevronRight, Coffee, Utensils, Map, Car, Train, Thermometer, Building2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './MapWindow.css'

const MAP_STYLES = {
  minimal: {
    label: 'Minimal',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  standard: {
    label: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
}

// Sample heatmap points (Aliso Viejo / SoCal area)
const HEATMAP_POINTS = [
  [33.575, -117.726, 0.8],
  [33.58, -117.72, 0.6],
  [33.57, -117.73, 0.5],
  [33.56, -117.74, 0.4],
  [33.59, -117.71, 0.3],
  [32.88, -117.234, 0.7],
  [32.89, -117.23, 0.4],
  [41.8781, -87.6298, 0.5],
  [37.5665, 126.978, 0.6],
]

const SAVED_LOCATIONS = {
  home: {
    name: 'Home',
    address: 'Aliso Viejo, CA',
    coords: [33.575, -117.726],
    zoom: 12,
    icon: Home,
  },
  school: {
    name: 'School',
    address: 'UC San Diego, 9500 Gilman Dr, La Jolla, CA',
    coords: [32.8801, -117.234],
    zoom: 15,
    icon: GraduationCap,
  },
  chicago: {
    name: 'Home Town',
    address: 'Chicago, IL',
    coords: [41.8781, -87.6298],
    zoom: 11,
    icon: MapPin,
  },
  seoul: {
    name: 'Second Home Town',
    address: 'Seoul, South Korea',
    coords: [37.5665, 126.978],
    zoom: 11,
    icon: Globe,
  },
}

// Placeholder - add locations later
const CAFE_LOCATIONS = {}
const FOOD_LOCATIONS = {}

const FOLDERS = [
  { id: 'savedLocations', label: 'Saved Locations', icon: MapPin, locations: SAVED_LOCATIONS },
  { id: 'cafe', label: 'Cafe', icon: Coffee, locations: CAFE_LOCATIONS },
  { id: 'food', label: 'Food', icon: Utensils, locations: FOOD_LOCATIONS },
]

const ALL_LOCATIONS = { ...SAVED_LOCATIONS, ...CAFE_LOCATIONS, ...FOOD_LOCATIONS }

function MapFlyTo({ coords, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (coords && coords.length === 2) {
      map.flyTo(coords, zoom ?? 12, { duration: 0.8 })
    }
  }, [coords, zoom, map])
  return null
}

function HeatmapLayer({ enabled }) {
  const map = useMap()
  useEffect(() => {
    if (!enabled || !L.heatLayer) return
    const layer = L.heatLayer(HEATMAP_POINTS, { radius: 25, blur: 15, maxZoom: 17 })
    layer.addTo(map)
    return () => map.removeLayer(layer)
  }, [map, enabled])
  return null
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

export default function MapWindow() {
  const [activeLocation, setActiveLocation] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState(new Set())
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
  const [layers, setLayers] = useState({ traffic: false, transit: false, heatmap: false, buildings3d: false })

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const flyToCoords = searchCoords ?? (activeLocation ? ALL_LOCATIONS[activeLocation]?.coords : null)
  const flyToZoom = searchCoords ? 14 : (activeLocation ? ALL_LOCATIONS[activeLocation]?.zoom : null)

  const toggleFolder = useCallback((id) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const goToLocation = useCallback((key) => {
    setActiveLocation(key)
    setSearchCoords(null)
    setSearchResult(null)
    setShowSuggestions(false)
  }, [])

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
    setRecentSearches((prev) => {
      const next = [{ query: item.address, ...item }, ...prev.filter((r) => r.address !== item.address)].slice(0, 5)
      return next
    })
  }, [])

  const markersToShow = []
  if (activeLocation && !searchCoords && ALL_LOCATIONS[activeLocation]) {
    markersToShow.push({ key: activeLocation, ...ALL_LOCATIONS[activeLocation] })
  }
  if (searchCoords) {
    markersToShow.push({ key: 'search', coords: searchCoords, address: searchResult?.address ?? 'Searched location' })
  }

  const currentStyle = MAP_STYLES[mapStyle] ?? MAP_STYLES.minimal

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
          <ZoomControl position="topright" />
          <TileLayer attribution={currentStyle.attribution} url={currentStyle.url} />
          <HeatmapLayer enabled={layers.heatmap} />
          {markersToShow.map((m) => (
            <Marker key={m.key} position={m.coords} icon={homeIcon}>
              <Popup>{m.address}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="map-window__view-options">
        <div className="map-window__view-dropdown">
          <Map size={16} strokeWidth={1.5} />
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="map-window__view-select"
            aria-label="Map style"
          >
            {Object.entries(MAP_STYLES).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="map-window__layer-controls">
        <button
          type="button"
          className={`map-window__layer-btn ${layers.traffic ? 'map-window__layer-btn--active' : ''}`}
          onClick={() => toggleLayer('traffic')}
          title="Traffic (placeholder)"
        >
          <Car size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`map-window__layer-btn ${layers.transit ? 'map-window__layer-btn--active' : ''}`}
          onClick={() => toggleLayer('transit')}
          title="Transit (placeholder)"
        >
          <Train size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`map-window__layer-btn ${layers.heatmap ? 'map-window__layer-btn--active' : ''}`}
          onClick={() => toggleLayer('heatmap')}
          title="Heatmap"
        >
          <Thermometer size={18} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          className={`map-window__layer-btn ${layers.buildings3d ? 'map-window__layer-btn--active' : ''}`}
          onClick={() => toggleLayer('buildings3d')}
          title="3D Buildings (placeholder)"
        >
          <Building2 size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="map-window__search-overlay">
        <div className="map-window__search-wrap map-window__search-wrap--relative">
          <Search size={18} strokeWidth={1.5} className="map-window__search-icon" />
          <input
            type="text"
            placeholder="Search for a place"
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
                <div className="map-window__suggestion-item map-window__suggestion-item--loading">Searching...</div>
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
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      <aside className="map-window__sidebar map-window__sidebar--overlay">
          {FOLDERS.map((folder) => {
            const Icon = folder.icon
            const entries = Object.entries(folder.locations)
            const isExpanded = expandedFolders.has(folder.id)
            return (
              <div key={folder.id} className="map-window__folder">
                <button
                  type="button"
                  className="map-window__folder-header"
                  onClick={() => toggleFolder(folder.id)}
                >
                  {isExpanded ? (
                    <ChevronDown size={18} strokeWidth={1.5} />
                  ) : (
                    <ChevronRight size={18} strokeWidth={1.5} />
                  )}
                  <Icon size={18} strokeWidth={1.5} />
                  <span className="map-window__folder-label">{folder.label}</span>
                </button>
                {isExpanded && (
                  <div className="map-window__folder-items">
                    {entries.length > 0 ? (
                      entries.map(([key, loc]) => {
                        const LocIcon = loc.icon ?? MapPin
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`map-window__saved-item ${activeLocation === key && !searchCoords ? 'map-window__saved-item--active' : ''}`}
                            onClick={() => goToLocation(key)}
                          >
                            <LocIcon size={20} strokeWidth={1.5} />
                            <div className="map-window__saved-item-text">
                              <span className="map-window__saved-item-name">{loc.name}</span>
                              <span className="map-window__saved-item-address">{loc.address}</span>
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      <div className="map-window__folder-empty">No locations yet</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {recentSearches.length > 0 && (
            <>
              <h3 className="map-window__sidebar-title map-window__sidebar-title--mt">Recent searches</h3>
              {recentSearches.map((r, i) => (
                <button
                  key={`${r.query}-${i}`}
                  type="button"
                  className="map-window__saved-item"
                  onClick={() => {
                    setSearchCoords(r.coords)
                    setSearchResult(r)
                    setActiveLocation(null)
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
    </div>
  )
}
