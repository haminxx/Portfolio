import {
  Home,
  Search,
  MessageCircle,
  Heart,
  PlusSquare,
  Grid3X3,
  Bookmark,
  User,
  Film,
  PartyPopper,
  GraduationCap,
  Wine,
  Sunset,
  PenLine,
  Radio,
} from 'lucide-react'
import './InstagramWindow.css'

const USERNAME = '85liez'
const POSTS = 6
const FOLLOWERS = 534
const FOLLOWING = 2139
const BIO_LINKS = ['@85liez_moto', '@ly_min2', '@85liez']

const HIGHLIGHTS = [
  { id: 'fun', label: 'FUN', icon: PartyPopper },
  { id: 'college', label: 'College Life', icon: GraduationCap },
  { id: 'hangouts', label: 'Hang Outs', icon: Wine },
  { id: 'moody', label: 'Moody', icon: Sunset },
  { id: 'carpe', label: 'Carpe Diem', icon: PenLine },
  { id: 'fpv', label: 'FPV', icon: Radio },
]

export default function InstagramWindow() {
  const POST_COUNT = 6

  return (
    <div className="instagram-window">
      <aside className="instagram-window__sidebar">
        <div className="instagram-window__logo">Instagram</div>
        <nav className="instagram-window__sidebar-nav">
          <button type="button" className="instagram-window__sidebar-btn instagram-window__sidebar-btn--active" aria-label="Home">
            <Home size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Search">
            <Search size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Reels">
            <Film size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Messages">
            <MessageCircle size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Activity">
            <Heart size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Create">
            <PlusSquare size={24} strokeWidth={1.5} />
          </button>
          <div className="instagram-window__sidebar-avatar" />
        </nav>
        <div className="instagram-window__sidebar-bottom">
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Grid">
            <Grid3X3 size={24} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__sidebar-btn" aria-label="Profile">
            <User size={24} strokeWidth={1.5} />
          </button>
        </div>
      </aside>
      <main className="instagram-window__main">
        <div className="instagram-window__profile-header">
          <div className="instagram-window__avatar-wrap">
            <div className="instagram-window__avatar" />
          </div>
          <div className="instagram-window__profile-info">
            <div className="instagram-window__profile-top">
              <h1 className="instagram-window__username">{USERNAME}</h1>
            </div>
            <div className="instagram-window__stats">
              <span><strong>{POSTS}</strong> posts</span>
              <span><strong>{FOLLOWERS}</strong> followers</span>
              <span><strong>{FOLLOWING}</strong> following</span>
            </div>
            <div className="instagram-window__bio">
              {BIO_LINKS.map((link) => (
                <span key={link} className="instagram-window__bio-link">{link}</span>
              ))}
            </div>
            <div className="instagram-window__profile-actions">
              <button type="button" className="instagram-window__btn instagram-window__btn--edit">Edit profile</button>
              <button type="button" className="instagram-window__btn instagram-window__btn--archive">View archive</button>
            </div>
          </div>
        </div>
        <div className="instagram-window__highlights">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon
            return (
              <button key={h.id} type="button" className="instagram-window__highlight">
                <div className="instagram-window__highlight-circle">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <span className="instagram-window__highlight-label">{h.label}</span>
              </button>
            )
          })}
        </div>
        <div className="instagram-window__tabs">
          <button type="button" className="instagram-window__tab instagram-window__tab--active" aria-label="Posts">
            <Grid3X3 size={12} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__tab" aria-label="Reels">
            <Film size={12} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__tab" aria-label="Saved">
            <Bookmark size={12} strokeWidth={1.5} />
          </button>
          <button type="button" className="instagram-window__tab" aria-label="Tagged">
            <User size={12} strokeWidth={1.5} />
          </button>
        </div>
        <div className="instagram-window__posts">
          {Array.from({ length: POST_COUNT }, (_, i) => (
            <div key={i} className="instagram-window__post">
              <div className="instagram-window__post-placeholder" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
