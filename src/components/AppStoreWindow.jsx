export default function AppStoreWindow() {
  return (
    <div className="app-store-window">
      <h2 className="app-store-window__title">App Store</h2>
      <div className="app-store-window__content">
        <p>Discover and install applications.</p>
        <div className="app-store-window__grid">
          <div className="app-store-window__card">Featured</div>
          <div className="app-store-window__card">Categories</div>
          <div className="app-store-window__card">Updates</div>
        </div>
      </div>
    </div>
  )
}
