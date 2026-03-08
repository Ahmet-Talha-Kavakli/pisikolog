import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll, Float, Text } from '@react-three/drei'

// S13: Lyra Environment (0.97 - 1.00)
// Burası artık gerçek Lyra dünyası. Beyaz, temiz, umut verici ve huzurlu.
export default function S13_LyraEnvironment() {
  const mainRef = useRef<THREE.Group>(null)
  const envRef = useRef<THREE.Group>(null)
  const scroll = useScroll()

  // Sahnede uçuşan beyaz partiküller (Polen/Kar gibi)
  const count = 2000
  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200
    }
    return [pos]
  }, [count])

  useFrame((state) => {
    if (mainRef.current) {
        const start = 0.98;
        const end = 1.0;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        mainRef.current.visible = scroll.offset > 0.97;
        
        const s = 0.5 + p * 0.5;
        mainRef.current.scale.set(s, s, s);

        if (envRef.current) {
            envRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    }
  })

  return (
    <group ref={mainRef} position={[0, -20, -40000]}>
      {/* Huzurlu Atmosfer - Beyaz/Mavi Işık */}
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 50, 0]} intensity={2} color="#ffffff" />

      {/* Uçuşan Partiküller */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.3} color="#ffffff" transparent opacity={0.6} />
      </points>

      <group ref={envRef}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          {/* Lyra Logosu Şeklinde bir Sembol (Beyaz Parlayan Küre) */}
          <mesh>
            <sphereGeometry args={[10, 32, 32]} />
            <meshStandardMaterial 
                color="#8b5cf6" 
                emissive="#8b5cf6" 
                emissiveIntensity={4} 
            />
          </mesh>

          <Text
            position={[0, 20, 0]}
            fontSize={6}
            color="white"
            maxWidth={100}
            textAlign="center"
          >
            LYRA
          </Text>
        </Float>

        {/* Etrafında dönen halkalar */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[15, 0.1, 16, 100]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Bitiş Yazısı */}
      <Text
        position={[0, -20, 20]}
        fontSize={3}
        color="white"
        fillOpacity={0.5}
      >
        Your journey is just beginning.
      </Text>
    </group>
  )
}
