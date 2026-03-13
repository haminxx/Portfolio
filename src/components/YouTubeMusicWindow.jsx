import './YouTubeMusicWindow.css'

export default function YouTubeMusicWindow() {
  return (
    <div className="ytmusic-window">
      <aside className="ytmusic-window__sidebar">
        <div className="ytmusic-window__logo">
          <span className="ytmusic-window__logo-icon">▶</span>
          <span className="ytmusic-window__logo-text">YouTube Music</span>
        </div>
        <nav className="ytmusic-window__nav">
          <span className="ytmusic-window__nav-item ytmusic-window__nav-item--active">Home</span>
          <span className="ytmusic-window__nav-item">Explore</span>
          <span className="ytmusic-window__nav-item">Library</span>
        </nav>
      </aside>
      <main className="ytmusic-window__main">
        <div className="ytmusic-window__search-bar">
          <input type="text" placeholder="Search" className="ytmusic-window__search-input" readOnly />
        </div>
        <div className="ytmusic-window__hero">
          <div className="ytmusic-window__hero-art">
            <div className="ytmusic-window__play-circle">
              <span className="ytmusic-window__play-icon">▶</span>
            </div>
          </div>
          <div className="ytmusic-window__hero-info">
            <h1 className="ytmusic-window__hero-title">Quick picks</h1>
            <p className="ytmusic-window__hero-desc">Based on your listening</p>
          </div>
        </div>
        <section className="ytmusic-window__section">
          <h2 className="ytmusic-window__section-title">Recommended for you</h2>
          <div className="ytmusic-window__grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="ytmusic-window__card">
                <div className="ytmusic-window__card-art" />
                <span className="ytmusic-window__card-title">Mix {i}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
