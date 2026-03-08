import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

export default function S07_CountryDescent() {
  const pointsRef = useRef<THREE.Points>(null)
  const scroll = useScroll()

  // 100x100 ızgara ile topoğrafik bir harita görünümü (nokta nokta)
  const gridSize = 150
  const count = gridSize * gridSize

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)

    let i = 0
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const px = (x - gridSize / 2) * 2.0
        const pz = (z - gridSize / 2) * 2.0
        const py = Math.sin(px * 0.1) * Math.cos(pz * 0.1) * 5.0 
                   + Math.sin(px * 0.05 + pz * 0.05) * 10.0

        pos[i * 3] = px
        pos[i * 3 + 1] = py - 30.0
        pos[i * 3 + 2] = pz // Relative to group position

        const normY = (py + 15) / 30.0
        cols[i * 3] = 0.2 + normY * 0.5
        cols[i * 3 + 1] = 0.8 - normY * 0.2
        cols[i * 3 + 2] = 0.3

        i++
      }
    }
    return [pos, cols]
  }, [gridSize, count])

  useFrame((state) => {
    if (pointsRef.current) {
        pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
        const start = 0.88;
        const end = 0.91;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        pointsRef.current.visible = scroll.offset > 0.85 && scroll.offset < 0.93;
        const pMat = pointsRef.current.material as THREE.PointsMaterial
        
        if (p > 0.0 && p < 1.0) {
            pMat.opacity = Math.sin(p * Math.PI) * 0.8
        } else {
            pMat.opacity = 0
        }
    }
  })

  return (
    <group position={[0, -100, -40000]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" count={count} args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial 
          size={0.2} 
          vertexColors={true} 
          transparent={true} 
          opacity={0} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
