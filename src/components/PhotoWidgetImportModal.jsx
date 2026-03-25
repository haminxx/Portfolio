import { useState } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { GALLERY_SIZE, getImagePath } from '../lib/gallery'
import './PhotoWidgetImportModal.css'

const MIN_PAD = 0
const MAX_PAD = 40

/**
 * @param {{
 *   onClose: () => void,
 *   onApply: (state: { galleryIndex: number, cropPadding: number }) => void,
 *   lastState?: { galleryIndex: number, cropPadding: number } | null
 * }} props
 */
export default function PhotoWidgetImportModal({ onClose, onApply, lastState }) {
  const [step, setStep] = useState('pick')
  const [pickedIndex, setPickedIndex] = useState(0)
  const [cropPadding, setCropPadding] = useState(0)

  const src = getImagePath(pickedIndex)

  const handlePick = (i) => {
    setPickedIndex(i)
    setCropPadding(lastState?.galleryIndex === i ? lastState.cropPadding : 0)
    setStep('crop')
  }

  const handleApply = () => {
    onApply({ galleryIndex: pickedIndex, cropPadding })
    onClose()
  }

  return (
    <div
      className="photo-import-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-import-title"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="photo-import-modal__backdrop" onMouseDown={onClose} aria-hidden />
      <div className="photo-import-modal__panel">
        <header className="photo-import-modal__head">
          {step === 'crop' && (
            <button type="button" className="photo-import-modal__back" onClick={() => setStep('pick')} aria-label="Back to gallery">
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
          )}
          <h2 id="photo-import-title" className="photo-import-modal__title">
            {step === 'pick' ? 'Choose from Photos' : 'Crop spacing'}
          </h2>
          <button type="button" className="photo-import-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        {step === 'pick' && (
          <div className="photo-import-modal__grid">
            {Array.from({ length: GALLERY_SIZE }, (_, i) => (
              <button
                key={i}
                type="button"
                className="photo-import-modal__thumb"
                onClick={() => handlePick(i)}
              >
                <img src={getImagePath(i)} alt="" className="photo-import-modal__thumb-img" />
              </button>
            ))}
          </div>
        )}

        {step === 'crop' && (
          <div className="photo-import-modal__crop">
            <p className="photo-import-modal__hint">Inset zooms out from the center — adjust padding before applying to the widget.</p>
            <div className="photo-import-modal__preview-wrap">
              <div
                className="photo-import-modal__preview"
                style={{ clipPath: `inset(${cropPadding}%)` }}
              >
                <img src={src} alt="" className="photo-import-modal__preview-img" />
              </div>
            </div>
            <label className="photo-import-modal__slider-label">
              <span>Spacing / crop inset ({cropPadding}%)</span>
              <input
                type="range"
                min={MIN_PAD}
                max={MAX_PAD}
                value={cropPadding}
                onChange={(e) => setCropPadding(Number(e.target.value))}
              />
            </label>
            <div className="photo-import-modal__actions">
              <button type="button" className="photo-import-modal__btn photo-import-modal__btn--primary" onClick={handleApply}>
                Apply to widget
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
