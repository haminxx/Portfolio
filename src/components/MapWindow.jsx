import { useState, useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Home, GraduationCap } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './MapWindow.css'

const LOCATIONS = {
  home: {
    name: 'Home',
    address: 'Aliso Viejo, CA',
    coords: [33.575, -117.726],
    zoom: 12,
  },
  school: {
    name: 'School',
    address: 'UC San Diego, 9500 Gilman Dr, La Jolla, CA',
    coords: [32.8801, -117.234],
    zoom: 15,
  },
}

function MapFlyTo({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) {
      const loc = LOCATIONS[location]
      if (loc) {
        map.flyTo(loc.coords, loc.zoom, { duration: 0.8 })
      }
    }
  }, [location, map])
  return null
}

const homeIcon = L.divIcon({
  className: 'map-window__custom-marker',
  html: '<div class="map-window__pin-outer"><div class="map-window__pin-inner"><span class="map-window__pin-arrow">▲</span></div></div>',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
})

export default function MapWindow() {
  const [activeLocation, setActiveLocation] = useState(null)

  const goToHome = useCallback(() => {
    setActiveLocation('home')
  }, [])

  const goToSchool = useCallback(() => {
    setActiveLocation('school')
  }, [])

  return (
    <div className="map-window">
      <div className="map-window__search">
        <input
          type="text"
          placeholder="Search"
          className="map-window__search-input"
          readOnly
        />
      </div>
      <div className="map-window__layout">
        <aside className="map-window__sidebar">
          <h3 className="map-window__sidebar-title">Recents</h3>
          <button
            type="button"
            className={`map-window__saved-item ${activeLocation === 'home' ? 'map-window__saved-item--active' : ''}`}
            onClick={goToHome}
          >
            <Home size={20} strokeWidth={1.5} />
            <div className="map-window__saved-item-text">
              <span className="map-window__saved-item-name">Home</span>
              <span className="map-window__saved-item-address">Aliso Viejo, CA</span>
            </div>
          </button>
          <button
            type="button"
            className={`map-window__saved-item ${activeLocation === 'school' ? 'map-window__saved-item--active' : ''}`}
            onClick={goToSchool}
          >
            <GraduationCap size={20} strokeWidth={1.5} />
            <div className="map-window__saved-item-text">
              <span className="map-window__saved-item-name">School</span>
              <span className="map-window__saved-item-address">UC San Diego</span>
            </div>
          </button>
        </aside>
        <div className="map-window__map">
          <MapContainer
            center={[33.575, -117.726]}
            zoom={10}
            className="map-window__leaflet"
          >
            <MapFlyTo location={activeLocation} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activeLocation === 'home' && (
              <Marker position={LOCATIONS.home.coords} icon={homeIcon}>
                <Popup>Home - Aliso Viejo, CA</Popup>
              </Marker>
            )}
            {activeLocation === 'school' && (
              <Marker position={LOCATIONS.school.coords} icon={homeIcon}>
                <Popup>UC San Diego - 9500 Gilman Dr, La Jolla, CA</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
