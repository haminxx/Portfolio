let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is browser-only')
  }
  if (!sharedCtx) {
    sharedCtx = new AudioContext()
  }
  return sharedCtx
}

/** Call after a user gesture so scratch sounds can play. */
export function resumeAboutAudio(): Promise<void> {
  try {
    return getCtx().resume()
  } catch {
    return Promise.resolve()
  }
}

/** Short filtered noise burst — pencil-on-paper feel. */
export function playSketchScratch(): void {
  try {
    const c = getCtx()
    if (c.state !== 'running') return
    const duration = 0.085
    const n = Math.floor(c.sampleRate * duration)
    const buffer = c.createBuffer(1, n, c.sampleRate)
    const ch = buffer.getChannelData(0)
    for (let i = 0; i < n; i += 1) {
      const t = i / n
      ch[i] = (Math.random() * 2 - 1) * (0.65 + 0.35 * (1 - t))
    }
    const src = c.createBufferSource()
    const filt = c.createBiquadFilter()
    filt.type = 'bandpass'
    filt.frequency.value = 2000
    filt.Q.value = 0.55
    const gain = c.createGain()
    gain.gain.setValueAtTime(0.11, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + duration)
    src.buffer = buffer
    src.connect(filt)
    filt.connect(gain)
    gain.connect(c.destination)
    src.start(c.currentTime)
    src.stop(c.currentTime + duration + 0.02)
  } catch {
    // ignore
  }
}
