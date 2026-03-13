import SystemTray from './SystemTray'
import './MenuBar.css'

export default function MenuBar() {
  return (
    <header className="menu-bar">
      <div className="menu-bar__left">
        <span className="menu-bar__app-name">Portfolio</span>
      </div>
      <div className="menu-bar__right">
        <SystemTray />
      </div>
    </header>
  )
}
