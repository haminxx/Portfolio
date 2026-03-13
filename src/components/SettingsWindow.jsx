export default function SettingsWindow() {
  return (
    <div className="settings-window">
      <h2 className="settings-window__title">Settings</h2>
      <div className="settings-window__content">
        <p>System preferences and configuration.</p>
        <ul className="settings-window__list">
          <li>Appearance</li>
          <li>Notifications</li>
          <li>Privacy & Security</li>
          <li>General</li>
        </ul>
      </div>
    </div>
  )
}
