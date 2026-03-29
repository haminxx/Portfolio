import { ChevronLeft, ChevronRight, RotateCw, Home } from 'lucide-react'
import './AddressBar.css'

export default function AddressBar({
  domain,
  onGoHome,
  onBack,
  onForward,
  onRefresh,
  canGoBack = true,
  canGoForward = true,
}) {
  return (
    <div className="address-bar">
      <div className="address-bar__nav">
        <button
          type="button"
          className="address-bar__btn"
          aria-label="Back"
          disabled={!canGoBack}
          aria-disabled={!canGoBack}
          onClick={onBack}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="address-bar__btn"
          aria-label="Forward"
          disabled={!canGoForward}
          aria-disabled={!canGoForward}
          onClick={onForward}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
        <button type="button" className="address-bar__btn" aria-label="Refresh" onClick={onRefresh}>
          <RotateCw size={16} strokeWidth={2.5} />
        </button>
        <button type="button" className="address-bar__btn" aria-label="Home" onClick={onGoHome}>
          <Home size={16} strokeWidth={2.5} />
        </button>
      </div>
      <div className="address-bar__url">
        <span className="address-bar__domain">{domain}</span>
      </div>
    </div>
  )
}
