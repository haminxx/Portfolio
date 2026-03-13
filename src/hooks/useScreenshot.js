import { useState, useCallback } from 'react'

export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState(null)

  const takeScreenshot = useCallback(async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screenshot is not supported in this browser')
      return
    }
    try {
      setError(null)
      setIsCapturing(true)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })

      const video = document.createElement('video')
      video.srcObject = stream
      video.play()

      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve
        video.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)

      stream.getTracks().forEach((t) => t.stop())

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `screenshot-${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
        setIsCapturing(false)
      }, 'image/png')
    } catch (err) {
      setIsCapturing(false)
      if (err.name === 'NotAllowedError') {
        setError('Screenshot was cancelled')
      } else {
        setError(err.message || 'Failed to take screenshot')
      }
    }
  }, [])

  return { isCapturing, error, takeScreenshot }
}
