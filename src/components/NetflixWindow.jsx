import './NetflixWindow.css'

export default function NetflixWindow() {
  return (
    <div className="netflix-window">
      <header className="netflix-window__header">
        <span className="netflix-window__logo">NETFLIX</span>
        <nav className="netflix-window__nav">
          <span className="netflix-window__nav-item netflix-window__nav-item--active">Home</span>
          <span className="netflix-window__nav-item">TV Shows</span>
          <span className="netflix-window__nav-item">Movies</span>
          <span className="netflix-window__nav-item">My List</span>
        </nav>
      </header>
      <div className="netflix-window__hero">
        <div className="netflix-window__hero-content">
          <h1 className="netflix-window__hero-title">Portfolio Spotlight</h1>
          <p className="netflix-window__hero-desc">Explore projects and experience</p>
          <div className="netflix-window__hero-btns">
            <button type="button" className="netflix-window__btn netflix-window__btn--play">Play</button>
            <button type="button" className="netflix-window__btn netflix-window__btn--info">More Info</button>
          </div>
        </div>
      </div>
      <div className="netflix-window__rows">
        <section className="netflix-window__row">
          <h2 className="netflix-window__row-title">Popular on Netflix</h2>
          <div className="netflix-window__row-items">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="netflix-window__card" />
            ))}
          </div>
        </section>
        <section className="netflix-window__row">
          <h2 className="netflix-window__row-title">Trending Now</h2>
          <div className="netflix-window__row-items">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="netflix-window__card" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
