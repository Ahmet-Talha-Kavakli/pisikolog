import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

export default function S09_DistrictApproach() {
  const pointsRef = useRef<THREE.Points>(null)
  const scroll = useScroll()

  const count = 5000
  const gridSize = 100 

  const [positions, dirstions, colors, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3) 
    const cols = new Float32Array(count * 3)
    const spd = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        const gridStep = Math.random() > 0.3 ? 5 : 2; 
        const px = (Math.floor(Math.random() * gridSize) - gridSize / 2) * gridStep
        const pz = (Math.floor(Math.random() * gridSize) - gridSize / 2) * gridStep
        
        const isHorizontal = Math.random() > 0.5
        if (isHorizontal) {
            dirs[i * 3] = Math.random() > 0.5 ? 1 : -1;
            dirs[i * 3 + 1] = 0;
            dirs[i * 3 + 2] = 0;
        } else {
            dirs[i * 3] = 0;
            dirs[i * 3 + 1] = 0;
            dirs[i * 3 + 2] = Math.random() > 0.5 ? 1 : -1;
        }

        pos[i * 3] = px
        pos[i * 3 + 1] = -50 
        pos[i * 3 + 2] = pz + (isHorizontal ? (Math.random() - 0.5) * gridStep : 0)

        const type = Math.random()
        if (type > 0.5) {
            cols[i * 3] = 1.0; cols[i * 3 + 1] = 0.05; cols[i * 3 + 2] = 0.05; 
        } else if (type > 0.2) {
            cols[i * 3] = 1.0; cols[i * 3 + 1] = 1.0; cols[i * 3 + 2] = 0.8; 
        } else {
            cols[i * 3] = 0.0; cols[i * 3 + 1] = 0.8; cols[i * 3 + 2] = 1.0; 
        }
        spd[i] = Math.random() * 20.0 + 5.0
    }
    return [pos, dirs, cols, spd]
  }, [count, gridSize])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScrollProgress: { value: 0 }
  }), [])

  const vertexShader = `
    uniform float uTime;
    uniform float uScrollProgress;
    attribute vec3 aDirection;
    attribute vec3 aColor;
    attribute float aSpeed;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vColor = aColor;
        vec3 offset = aDirection * (uTime * aSpeed);
        vec3 p = position;
        if (aDirection.x != 0.0) { p.x = position.x + mod(offset.x, 250.0) - 125.0; }
        if (aDirection.z != 0.0) { p.z = position.z + mod(offset.z, 250.0) - 125.0; }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (15.0) * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = smoothstep(0.0, 0.2, uScrollProgress) * (1.0 - smoothstep(0.8, 1.0, uScrollProgress));
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float strength = 0.1 / distanceToCenter - 0.2;
        strength = clamp(strength, 0.0, 1.0);
        gl_FragColor = vec4(vColor, strength * vAlpha);
    }
  `

  useFrame((state) => {
    if (pointsRef.current) {
        pointsRef.current.visible = scroll.offset > 0.88 && scroll.offset < 0.96;
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
        const start = 0.91;
        const end = 0.94;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uScrollProgress.value = p
    }
  })

  return (
    <group position={[0, -50, -36000]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
          <bufferAttribute attach="attributes-aDirection" count={count} args={[dirstions, 3]} />
          <bufferAttribute attach="attributes-aColor" count={count} args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSpeed" count={count} args={[speeds, 1]} />
        </bufferGeometry>
        <shaderMaterial 
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
