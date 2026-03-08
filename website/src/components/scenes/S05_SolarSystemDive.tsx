import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// Basit gezegen model bileşeni
function Planet({ 
    position, 
    color, 
    size, 
    emissive = '#000000', 
    speed = 0.5,
    scrollStart = 0.45,
    scrollEnd = 0.6,
    hasRings = false,
    ringColor = '#ffffff'
}: {
    position: [number, number, number],
    color: string,
    size: number,
    emissive?: string,
    speed?: number,
    scrollStart?: number,
    scrollEnd?: number,
    hasRings?: boolean,
    ringColor?: string
}) {
    const meshRef = useRef<THREE.Group>(null)
    const scroll = useScroll()

    useFrame((state, delta) => {
        if (!meshRef.current) return
        meshRef.current.rotation.y += delta * speed;
        const range = scrollEnd - scrollStart;
        let p = (scroll.offset - scrollStart) / range;
        p = Math.max(0, Math.min(1, p));
        meshRef.current.position.z = position[2] + (p * 800.0);
        
        // Scale pulse
        const scale = 1.0 + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
        meshRef.current.scale.set(scale, scale, scale);
    })

    return (
        <group ref={meshRef} position={new THREE.Vector3(...position)}>
            {/* Gezegen Küresi */}
            <mesh>
                <sphereGeometry args={[size, 64, 64]} />
                <meshPhysicalMaterial 
                    color={color} 
                    emissive={emissive}
                    emissiveIntensity={emissive !== '#000000' ? 5 : 0}
                    roughness={0.4}
                    metalness={0.3}
                    clearcoat={0.1}
                    reflectivity={0.5}
                />
            </mesh>

            {/* Atmosphere Glow (Fresnel-like) */}
            <mesh scale={[1.1, 1.1, 1.1]}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial 
                    color={color} 
                    transparent 
                    opacity={0.15} 
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Satürn tarzı halka */}
            {hasRings && (
                <mesh rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
                    <ringGeometry args={[size * 1.5, size * 2.5, 64]} />
                    <meshStandardMaterial 
                        color={ringColor} 
                        side={THREE.DoubleSide} 
                        transparent 
                        opacity={0.6}
                        roughness={1}
                    />
                </mesh>
            )}
        </group>
    )
}

export default function S05_SolarSystemDive() {
  const groupRef = useRef<THREE.Group>(null)
  const scroll = useScroll()

  useFrame(() => {
    if(groupRef.current) {
        const start = 0.6;
        const end = 0.75;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        groupRef.current.visible = scroll.offset > 0.55 && scroll.offset < 0.8;
        
        const s = 0.2 + p * 0.8;
        groupRef.current.scale.set(s, s, s);
    }
  })

  return (
    <group ref={groupRef} position={[0, -50, -30000]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, -50]} intensity={1.5} color="#fff" />
      
      {/* Güneş (Çok Uzakta ve Büyük) */}
      <Planet 
        position={[-30, 10, -580]} 
        color="#ffcc00" 
        emissive="#ffaa00" 
        size={30} 
        scrollStart={0.4} 
        scrollEnd={0.7} 
      />

      {/* Dış Gezegenler */}
      <Planet 
        position={[20, -5, -530]} 
        color="#3b82f6" // Neptün mavisi
        size={4} 
        speed={1.0}
      />
      
      <Planet 
        position={[-15, 8, -500]} 
        color="#eab308" // Satürn sarımsı
        size={6} 
        hasRings={true}
        ringColor="#fef08a"
        speed={0.8}
      />

      <Planet 
        position={[10, -2, -470]} 
        color="#c2410c" // Jüpiter turuncu/kahve
        size={8} 
        speed={0.6}
      />

      {/* İç Gezegenler - Mars */}
      <Planet 
        position={[-5, 2, -460]} 
        color="#ef4444" // Kızıl gezegen
        size={2} 
        speed={0.2}
      />

      {/* Not: Dünya S06'nın odak noktasıdır, burada çok küçük gösterilebilir veya sıradaki flow'a bırakılır */}
    </group>
  )
}
