import { Component, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import * as THREE from 'three'

// Symmetric maple-leaf outline (right half, mirrored).
function makeLeafShape() {
  // Right half of a stylised sugar-maple leaf, top point first, going clockwise.
  const right = [
    [0, 1.0], [0.18, 0.62], [0.4, 0.7], [0.29, 0.12], [0.6, 0.38], [0.55, 0.16],
    [1.0, 0.2], [0.64, -0.2], [0.73, -0.43], [0.2, -0.33], [0.05, -0.33], [0.05, -0.95],
  ]
  const left = right.slice(1).reverse().map(([x, y]) => [-x, y])
  const pts = [...right, ...left]
  const shape = new THREE.Shape()
  pts.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)))
  shape.closePath()
  return shape
}

const MOODS = {
  idle: { leaf: '#e3242b', glow: '#f2c14e', fog: '#070a1f' },
  correct: { leaf: '#3ddc84', glow: '#9dffc8', fog: '#06281a' },
  wrong: { leaf: '#ff4d4d', glow: '#ff9a9a', fog: '#2a0a12' },
  win: { leaf: '#ffd166', glow: '#fff3b0', fog: '#1d1405' },
}

function Leaves({ count = 90, mood }) {
  const mesh = useRef()
  const geom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(makeLeafShape(), { depth: 0.06, bevelEnabled: false })
    g.center()
    return g
  }, [])
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 30,
        z: -4 - Math.random() * 22,
        s: 0.25 + Math.random() * 0.6,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        spd: 0.2 + Math.random() * 0.5,
        sway: Math.random() * Math.PI * 2,
      })),
    [count],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useRef(new THREE.Color(MOODS.idle.leaf))

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    color.current.lerp(new THREE.Color(MOODS[mood]?.leaf || MOODS.idle.leaf), 0.05)
    mesh.current.material.color.copy(color.current)
    seeds.forEach((p, i) => {
      p.y -= p.spd * dt
      if (p.y < -16) p.y = 16
      const sx = Math.sin(t * 0.6 + p.sway) * 0.8
      dummy.position.set(p.x + sx, p.y, p.z)
      dummy.rotation.set(p.rx + t * 0.4 * p.spd, p.ry + t * 0.3, p.rz + Math.sin(t + p.sway) * 0.4)
      dummy.scale.setScalar(p.s)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geom, undefined, count]}>
      <meshStandardMaterial color={MOODS.idle.leaf} roughness={0.55} metalness={0.15} />
    </instancedMesh>
  )
}

function StudioRings({ mood }) {
  const group = useRef()
  const mat = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    group.current.rotation.z = t * 0.08
    group.current.rotation.x = Math.sin(t * 0.2) * 0.25
    const target = new THREE.Color(MOODS[mood]?.glow || MOODS.idle.glow)
    mat.current.color.lerp(target, 0.05)
    mat.current.emissive.lerp(target, 0.05)
  })
  return (
    <group ref={group} position={[0, 0, -14]}>
      {[7, 9.5, 12].map((r, i) => (
        <mesh key={r} rotation={[0, 0, (i * Math.PI) / 6]}>
          <torusGeometry args={[r, 0.05 + i * 0.02, 12, 120]} />
          <meshStandardMaterial
            ref={i === 0 ? mat : undefined}
            color={MOODS.idle.glow}
            emissive={MOODS.idle.glow}
            emissiveIntensity={0.9}
            transparent
            opacity={0.55 - i * 0.12}
          />
        </mesh>
      ))}
    </group>
  )
}

function Spotlights() {
  const a = useRef()
  const b = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    a.current.position.set(Math.sin(t * 0.5) * 10, 6, -2)
    b.current.position.set(Math.cos(t * 0.4) * 10, -4, -4)
  })
  return (
    <>
      <pointLight ref={a} intensity={60} color="#ffd166" distance={40} />
      <pointLight ref={b} intensity={40} color="#4ea8ff" distance={40} />
    </>
  )
}

function FogColor({ mood }) {
  const col = useRef(new THREE.Color(MOODS.idle.fog))
  useFrame((state) => {
    col.current.lerp(new THREE.Color(MOODS[mood]?.fog || MOODS.idle.fog), 0.04)
    if (state.scene.fog) state.scene.fog.color.copy(col.current)
    state.gl.setClearColor(col.current, 1)
  })
  return <fog attach="fog" args={[MOODS.idle.fog, 10, 40]} />
}

// If WebGL is unavailable (old GPU, headless browser, blocked context), fall
// back to a plain CSS gradient so the quiz itself keeps working.
function webglSupported() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

class CanvasBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('3D backdrop disabled:', err?.message)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function Backdrop({ mood = 'idle' }) {
  const [ok, setOk] = useState(false)
  useEffect(() => setOk(webglSupported()), [])
  return (
    <div className={`backdrop mood-${mood}`} aria-hidden="true">
      {ok && (
      <CanvasBoundary>
      <Canvas
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <FogColor mood={mood} />
        <ambientLight intensity={0.5} />
        <Spotlights />
        <Stars radius={60} depth={40} count={2500} factor={3} saturation={0.3} fade speed={0.6} />
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
          <StudioRings mood={mood} />
        </Float>
        <Leaves mood={mood} />
      </Canvas>
      </CanvasBoundary>
      )}
    </div>
  )
}
