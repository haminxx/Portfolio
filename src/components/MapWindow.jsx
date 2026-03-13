import { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Home, GraduationCap, MapPin, Globe, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './MapWindow.css'

const LOCATIONS = {
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

function MapFlyTo({ coords, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (coords && coords.length === 2) {
      map.flyTo(coords, zoom ?? 12, { duration: 0.8 })
    }
  }, [coords, zoom, map])
  return null
}

const homeIcon = L.divIcon({
  className: 'map-window__custom-marker',
  html: '<div class="map-window__pin-outer"><div class="map-window__pin-inner"><span class="map-window__pin-arrow">▲</span></div></div>',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
})

async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PortfolioMap/1.0',
      },
    }
  )
  const data = await res.json()
  if (data && data[0]) {
    const { lat, lon, display_name } = data[0]
    return { coords: [parseFloat(lat), parseFloat(lon)], address: display_name }
  }
  return null
}

export default function MapWindow() {
  const [activeLocation, setActiveLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchCoords, setSearchCoords] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])

  const flyToCoords = searchCoords ?? (activeLocation ? LOCATIONS[activeLocation]?.coords : null)
  const flyToZoom = searchCoords ? 14 : (activeLocation ? LOCATIONS[activeLocation]?.zoom : null)

  const goToLocation = useCallback((key) => {
    setActiveLocation(key)
    setSearchCoords(null)
    setSearchResult(null)
  }, [])

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setIsSearching(true)
    setSearchResult(null)
    try {
      const result = await geocode(q)
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

  return (
    <div className="map-window">
      <div className="map-window__search">
        <div className="map-window__search-wrap">
          <Search size={18} strokeWidth={1.5} className="map-window__search-icon" />
          <input
            type="text"
            placeholder="Search for a place"
            className="map-window__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
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
      <div className="map-window__layout">
        <aside className="map-window__sidebar">
          <h3 className="map-window__sidebar-title">Recents</h3>
          {Object.entries(LOCATIONS).map(([key, loc]) => {
            const Icon = loc.icon ?? MapPin
            return (
              <button
                key={key}
                type="button"
                className={`map-window__saved-item ${activeLocation === key && !searchCoords ? 'map-window__saved-item--active' : ''}`}
                onClick={() => goToLocation(key)}
              >
                <Icon size={20} strokeWidth={1.5} />
                <div className="map-window__saved-item-text">
                  <span className="map-window__saved-item-name">{loc.name}</span>
                  <span className="map-window__saved-item-address">{loc.address}</span>
                </div>
              </button>
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
        <div className="map-window__map">
          <MapContainer
            center={[33.575, -117.726]}
            zoom={10}
            className="map-window__leaflet"
          >
            <MapFlyTo coords={flyToCoords} zoom={flyToZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activeLocation && !searchCoords && (
              <Marker position={LOCATIONS[activeLocation].coords} icon={homeIcon}>
                <Popup>{LOCATIONS[activeLocation].address}</Popup>
              </Marker>
            )}
            {searchCoords && (
              <Marker position={searchCoords} icon={homeIcon}>
                <Popup>{searchResult?.address ?? 'Searched location'}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
