import './MapWindow.css'

export default function MapWindow() {
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
      <div className="map-window__map">
        <div className="map-window__map-regions">
          <div className="map-window__region map-window__region--blue" />
          <div className="map-window__region map-window__region--green map-window__region--top-right" />
          <div className="map-window__region map-window__region--green map-window__region--top-left" />
          <div className="map-window__region map-window__region--pink" />
          <div className="map-window__region map-window__region--yellow" />
          <div className="map-window__road map-window__road--vertical" />
          <div className="map-window__road map-window__road--curved" />
        </div>
        <div className="map-window__pin">
          <div className="map-window__pin-outer">
            <div className="map-window__pin-inner">
              <span className="map-window__pin-arrow">▲</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
