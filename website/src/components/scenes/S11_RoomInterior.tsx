import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll, Text } from '@react-three/drei'

export default function S11_RoomInterior() {
  const groupRef = useRef<THREE.Group>(null)
  const roomMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const phoneMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const phoneLightRef = useRef<THREE.PointLight>(null)
  const scroll = useScroll()

  useFrame((state) => {
    if (groupRef.current) {
        const start = 0.96;
        const end = 0.98;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        groupRef.current.visible = scroll.offset > 0.95 && scroll.offset < 0.99;
        
        // Renk geçişi: Siyah -> Mor (Lyra etkisi)
        const bgColor = new THREE.Color("#000000").lerp(new THREE.Color("#1e1b4b"), p);
        if (roomMatRef.current) roomMatRef.current.color = bgColor;
        
        const phoneColor = new THREE.Color("#ffffff").lerp(new THREE.Color("#8b5cf6"), p);
        if (phoneMatRef.current) phoneMatRef.current.color = phoneColor;

        // Telefon ışığı pulsasyonu
        if (phoneLightRef.current) {
            phoneLightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 10) * 1.5;
        }
    }
  })

  return (
    <group ref={groupRef} position={[0, -20, -39000]}>
        {/* Oda Duvarları (Ters Çevrilmiş Kutu) */}
        <mesh scale={[100, 100, 100]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                ref={roomMatRef}
                side={THREE.BackSide} 
                color="#000000" 
                roughness={1} 
            />
        </mesh>

        {/* Telefon / Ekran Ekranı */}
        <mesh position={[0, 5, -30]}>
            <planeGeometry args={[10, 18]} />
            <meshBasicMaterial ref={phoneMatRef} color="#ffffff" />
            <pointLight 
                ref={phoneLightRef}
                position={[0, 0, 5]} 
                intensity={5} 
                distance={100} 
                color="#8b5cf6" 
            />
        </mesh>

        {/* Oda İçindeki Kasvetli Yazılar */}
        <Text
            position={[0, 20, -40]}
            fontSize={4}
            color="#475569"
            maxWidth={50}
            textAlign="center"
            font="https://fonts.gstatic.com/s/syncopate/v22/pe0sMIu3Y9jV0Sow1mS_oFm_6fOth-Y.woff"
        >
            The darkness before the light.
        </Text>
    </group>
  )
}
