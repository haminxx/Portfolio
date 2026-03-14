import { useState, useRef, useEffect } from 'react'
import { Camera, Heart } from 'lucide-react'
import './ContactPage.css'

export default function ContactPage() {
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (capturedPhoto) return
    let stream = null
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraError(null)
      } catch (err) {
        setCameraError('Camera access denied or unavailable')
      }
    }
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [capturedPhoto])

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCapturedPhoto(dataUrl)
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="contact-page">
      <h1 className="contact-page__title">Contact</h1>
      <div className="contact-page__booth">
        <div className="contact-page__photo-section">
          {!capturedPhoto ? (
            <div className="contact-page__camera-wrap">
              {cameraError ? (
                <div className="contact-page__camera-error">
                  <Camera size={48} />
                  <p>{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="contact-page__video"
                    autoPlay
                    playsInline
                    muted
                  />
                  <button
                    type="button"
                    className="contact-page__capture-btn"
                    onClick={capturePhoto}
                    disabled={!!cameraError}
                    title="Take photo"
                  >
                    <Camera size={28} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="contact-page__sticker-frame">
              <span className="contact-page__sticker-heart contact-page__sticker-heart--tl">
                <Heart size={20} fill="currentColor" />
              </span>
              <span className="contact-page__sticker-heart contact-page__sticker-heart--tr">
                <Heart size={20} fill="currentColor" />
              </span>
              <span className="contact-page__sticker-heart contact-page__sticker-heart--bl">
                <Heart size={20} fill="currentColor" />
              </span>
              <span className="contact-page__sticker-heart contact-page__sticker-heart--br">
                <Heart size={20} fill="currentColor" />
              </span>
              <img src={capturedPhoto} alt="Your photo" className="contact-page__sticker-img" />
              <button
                type="button"
                className="contact-page__retake-btn"
                onClick={retakePhoto}
              >
                Retake
              </button>
            </div>
          )}
        </div>
        <form className="contact-page__form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            className="contact-page__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            className="contact-page__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            placeholder="Message or question"
            className="contact-page__textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="contact-page__submit-btn">
            {submitted ? 'Sent!' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
