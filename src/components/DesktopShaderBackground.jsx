/**
 * CSS-only animated background (no WebGL). Avoids Three/R3F + Rolldown "is not a constructor" crashes.
 */
export default function DesktopShaderBackground() {
  return (
    <div className="desktop-shader-bg" aria-hidden>
      <div className="desktop-shader-bg__base" />
      <div className="desktop-shader-bg__orb desktop-shader-bg__orb--a" />
      <div className="desktop-shader-bg__orb desktop-shader-bg__orb--b" />
      <div className="desktop-shader-bg__orb desktop-shader-bg__orb--c" />
    </div>
  )
}
