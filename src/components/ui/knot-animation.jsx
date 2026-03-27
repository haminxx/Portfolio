import { useEffect, useRef, useState } from 'react'

const W = 80
const H = 40
const PI = 3.14159265
const ramp = '.,-~:;=!*#$@'
const COLOR_PALETTE = [
  '#e53935',
  '#43a047',
  '#fbc02d',
  '#1e88e5',
  '#8e24aa',
  '#fb8c00',
  '#00897b',
  '#c0ca33',
]

const vadd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z })
const vmul = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s })
const vdot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z
const vnorm = (v) => {
  const r = Math.sqrt(vdot(v, v))
  return vmul(v, 1.0 / r)
}
const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

export function KnotAnimation({ color = true, speedA = 0.04, speedB = 0.02 }) {
  const [frame, setFrame] = useState([])
  const aRef = useRef(0)
  const bRef = useRef(0)

  useEffect(() => {
    const screen = Array(W * H).fill(' ')
    const colorIdx = Array(W * H).fill(-1)
    const zbuf = Array(W * H).fill(0)

    const renderOnce = () => {
      aRef.current += speedA
      bRef.current += speedB
      const A = aRef.current
      const B = bRef.current
      screen.fill(' ')
      colorIdx.fill(-1)
      zbuf.fill(0)

      const light = vnorm({ x: -1, y: 1, z: -1 })
      const cA = Math.cos(A)
      const sA = Math.sin(A)
      const cB = Math.cos(B)
      const sB = Math.sin(B)

      let tubeIdx = 0
      for (let u = 0; u < 2 * PI; u += 0.06, tubeIdx += 1) {
        const cu = u
        const cu2 = 2 * cu
        const cu3 = 3 * cu
        const C = {
          x: Math.sin(cu) + 2 * Math.sin(cu2),
          y: Math.cos(cu) - 2 * Math.cos(cu2),
          z: -Math.sin(cu3),
        }
        const T = vnorm({
          x: Math.cos(cu) + 4 * Math.cos(cu2),
          y: -Math.sin(cu) + 4 * Math.sin(cu2),
          z: -3 * Math.cos(cu3),
        })
        const up = Math.abs(vdot(T, { x: 0, y: 1, z: 0 })) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
        const N = vnorm(cross(T, up))
        const Bn = cross(T, N)
        const R = 0.3
        const segColorIdx = tubeIdx % COLOR_PALETTE.length

        for (let v = 0; v < 2 * PI; v += 0.2) {
          const cv = Math.cos(v)
          const sv = Math.sin(v)
          const offs = vadd(vmul(N, cv * R), vmul(Bn, sv * R))
          const p = vadd(C, offs)
          const x1 = p.x
          const y1 = p.y * cA - p.z * sA
          const z1 = p.y * sA + p.z * cA
          const x2 = x1 * cB + z1 * sB
          const y2 = y1
          const z2 = -x1 * sB + z1 * cB + 5.0
          const invz = 1.0 / z2
          const px = Math.floor(W / 2 + 40 * x2 * invz)
          const py = Math.floor(H / 2 - 20 * y2 * invz)
          if (px >= 0 && px < W && py >= 0 && py < H) {
            const idx = px + py * W
            if (invz > zbuf[idx]) {
              zbuf[idx] = invz
              const n = vnorm(offs)
              const nx1 = n.x
              const ny1 = n.y * cA - n.z * sA
              const nz1 = n.y * sA + n.z * cA
              const nx2 = nx1 * cB + nz1 * sB
              const ny2 = ny1
              const nz2 = -nx1 * sB + nz1 * cB
              const nr = { x: nx2, y: ny2, z: nz2 }
              const lum = Math.max(0, vdot(nr, light))
              const ci = Math.floor(lum * (ramp.length - 1))
              screen[idx] = ramp[ci]
              colorIdx[idx] = segColorIdx
            }
          }
        }
      }

      const frameLines = []
      for (let y = 0; y < H; y += 1) {
        const line = []
        for (let x = 0; x < W; x += 1) {
          const idx = x + y * W
          if (screen[idx] === ' ') {
            line.push(<span key={x}> </span>)
          } else if (color) {
            line.push(
              <span key={x} style={{ color: COLOR_PALETTE[colorIdx[idx]] }}>
                {screen[idx]}
              </span>,
            )
          } else {
            line.push(<span key={x}>{screen[idx]}</span>)
          }
        }
        frameLines.push(<div key={y}>{line}</div>)
      }
      setFrame(frameLines)
    }

    const id = setInterval(renderOnce, 33)
    renderOnce()
    return () => clearInterval(id)
  }, [color, speedA, speedB])

  return <pre className="desktop-widgets__knot-pre">{frame}</pre>
}
