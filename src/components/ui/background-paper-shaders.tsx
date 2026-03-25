import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  uniform float uTime;
  uniform float waveAmp;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float w = sin(pos.x * 2.2 + uTime * 0.55) * 0.07 * waveAmp;
    pos.y += w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float phase = uv.x * 1.6 + uv.y * 0.85 - uTime * 0.35;
    float band = sin(phase) * 0.5 + 0.5;
    band = smoothstep(0.18, 0.88, band);
    vec3 base = mix(color1, color2, band);
    float vig = 1.0 - length(uv - 0.5) * 1.12;
    vig = smoothstep(0.12, 1.0, vig);
    float sweep = (uv.x + uv.y) * 2.0 - uTime * 0.42;
    float hilite = pow(max(0.0, sin(sweep) * 0.5 + 0.5), 4.0);
    vec3 rgb = base * vig + hilite * 0.22 * color2;
    gl_FragColor = vec4(rgb, 1.0);
  }
`

export function ShaderPlane({
  position,
  scale,
  viewportPad,
  color1 = '#121018',
  color2 = '#d4cfc4',
  speed = 0.35,
  waveAmp = 1.0,
}: {
  position: [number, number, number]
  scale?: [number, number, number]
  viewportPad?: number
  color1?: string
  color2?: string
  speed?: number
  waveAmp?: number
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const viewport = useThree((s) => s.viewport)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      waveAmp: { value: waveAmp },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    // color1/color2/waveAmp in useMemo initial only; we sync in useFrame for live slider updates
    [],
  )

  const color1Ref = useRef(color1)
  const color2Ref = useRef(color2)
  const waveAmpRef = useRef(waveAmp)
  const speedRef = useRef(speed)
  color1Ref.current = color1
  color2Ref.current = color2
  waveAmpRef.current = waveAmp
  speedRef.current = speed

  useFrame((state) => {
    if (!mesh.current) return
    if (viewportPad != null) {
      const w = viewport.width
      const h = viewport.height
      if (w > 0 && h > 0) {
        mesh.current.scale.set(w * viewportPad, h * viewportPad, 1)
      }
    }
    const elapsed = state.clock.elapsedTime
    uniforms.uTime.value = elapsed * speedRef.current
    uniforms.waveAmp.value = waveAmpRef.current
    uniforms.color1.value.set(color1Ref.current)
    uniforms.color2.value.set(color2Ref.current)
  })

  return (
    <mesh
      ref={mesh}
      position={position}
      scale={viewportPad != null ? [1, 1, 1] : (scale ?? [1, 1, 1])}
      frustumCulled={false}
    >
      <planeGeometry args={[2, 2, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
