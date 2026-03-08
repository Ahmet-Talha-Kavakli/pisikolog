import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

export default function S10_SingleHouse() {
  const houseRef = useRef<THREE.Group>(null)
  const scroll = useScroll()

  useFrame((state) => {
    if (houseRef.current) {
        const start = 0.94;
        const end = 0.96;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        houseRef.current.visible = scroll.offset > 0.92 && scroll.offset < 0.98;
        
        // Eve yaklaşırken büyüme
        const s = 1.0 + p * 5.0; 
        houseRef.current.scale.set(s, s, s);

        // Opacity kontrolü
        houseRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
                mat.transparent = true;
                if (p > 0.0 && p < 1.0) {
                    mat.opacity = Math.sin(p * Math.PI);
                } else {
                    mat.opacity = 0;
                }
            }
        });

        // Hafif sallanma
        houseRef.current.position.y = -50 + Math.sin(state.clock.elapsedTime) * 2;
    }
  })

  return (
    <group ref={houseRef} position={[0, -50, -38000]}>
        {/* Ana Bina Bloğu - Koyu gri beton */}
        <mesh position={[0, 10, 0]}>
            <boxGeometry args={[30, 20, 20]} />
            <meshStandardMaterial color="#2d3748" roughness={0.9} />
        </mesh>

        {/* Pencere - Parlayan Lyra rengi */}
        <mesh position={[5, 12, 10.1]}>
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial 
                color="#8b5cf6" 
                emissive="#8b5cf6" 
                emissiveIntensity={2} 
            />
        </mesh>

        {/* Pencere - İçeride biri varmış gibi (Sarı) */}
        <mesh position={[-5, 8, 10.1]}>
            <planeGeometry args={[3, 5]} />
            <meshStandardMaterial 
                color="#fbbf24" 
                emissive="#fbbf24" 
                emissiveIntensity={1} 
            />
        </mesh>
    </group>
  )
}
