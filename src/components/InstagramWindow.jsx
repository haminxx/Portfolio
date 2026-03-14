import { Search, Heart, MessageCircle, PlusSquare, Home } from 'lucide-react'
import './InstagramWindow.css'

export default function InstagramWindow() {
  const GRID_COLS = 3
  const GRID_ROWS = 4
  const POST_COUNT = GRID_COLS * GRID_ROWS

  return (
    <div className="instagram-window">
      <header className="instagram-window__header">
        <div className="instagram-window__logo">Instagram</div>
        <div className="instagram-window__search-wrap">
          <Search size={14} className="instagram-window__search-icon" />
          <input
            type="search"
            placeholder="Search"
            className="instagram-window__search"
            readOnly
          />
        </div>
        <nav className="instagram-window__nav">
          <button type="button" className="instagram-window__nav-btn" aria-label="Home">
            <Home size={22} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__nav-btn" aria-label="Messages">
            <MessageCircle size={22} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__nav-btn" aria-label="New post">
            <PlusSquare size={22} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__nav-btn" aria-label="Activity">
            <Heart size={22} strokeWidth={1.5} />
          </button>
        </nav>
      </header>
      <div className="instagram-window__stories">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="instagram-window__story">
            <div className="instagram-window__story-avatar" />
            <span className="instagram-window__story-name">Story {i + 1}</span>
          </div>
        ))}
      </div>
      <div className="instagram-window__feed">
        {Array.from({ length: POST_COUNT }, (_, i) => (
          <div key={i} className="instagram-window__post">
            <div className="instagram-window__post-placeholder" />
          </div>
        ))}
      </div>
    </div>
  )
}
