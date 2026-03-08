import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

export default function S08_CityZoom() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const scroll = useScroll()

  // 1000 gökdelen (Şehir)
  const count = 1000
  const citySize = 400

  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Sabit Matris ve Renk Hesaplama
  const [matrices, colors] = useMemo(() => {
    const mats = new Float32Array(count * 16)
    const cols = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Şehir dışarıdan merkeze doğru yoğunlaşır
      const theta = Math.random() * Math.PI * 2
      const radius = Math.random() * Math.random() * citySize // Merkeze kümelenme

      const x = Math.cos(theta) * radius
      const z = Math.sin(theta) * radius // Relative to group position
      
      // Merkezde binalar uzun, dışarıda kısa
      const maxH = 100 - radius * 0.2
      const yHeight = Math.max(5, Math.random() * maxH)

      // Dummy nesneyi boyutlandırıp yerleştir
      dummy.position.set(x, yHeight / 2 - 50, z) // -50 ile genel y tabanı kasten altta tutuldu
      dummy.scale.set(Math.random() * 4 + 2, yHeight, Math.random() * 4 + 2)
      dummy.updateMatrix()

      dummy.matrix.toArray(mats, i * 16)

      // Renk - Şehir grisi ve neon mavisi karışımlı
      const c = new THREE.Color()
      const mix = Math.random()

      if (mix > 0.8) {
          c.setHex(0x0ea5e9) // Neon mavi
      } else if (mix > 0.6) {
          c.setHex(0xf59e0b) // Sıcak turuncu sokak lambası etkisi
      } else {
          c.setHex(0x334155) // Gri beton
      }

      c.toArray(cols, i * 3)
    }

    return [mats, cols]
  }, [count, citySize, dummy])

  useFrame(() => {
    if (meshRef.current) {
        const start = 0.88;
        const end = 0.91;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));

        meshRef.current.visible = scroll.offset > 0.85 && scroll.offset < 0.93;
        const mat = meshRef.current.material as THREE.MeshStandardMaterial
        
        if (p > 0.0 && p < 1.0) {
            mat.opacity = Math.sin(p * Math.PI) * 0.9
            mat.transparent = true
        } else {
            mat.opacity = 0
            mat.transparent = true
        }
    }
  })

  return (
    <group position={[0, -50, -34000]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]}>
           {/* Vertex colors desteler Instanced Mesh içerisinde */}
           <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        {/* City için daha endüstriyel standart materyal */}
        <meshStandardMaterial 
          vertexColors={true}
          roughness={0.8}
          metalness={0.2}
          transparent={true}
          opacity={0}
        />
        {/* İlk buffer verisini manuel set edelim */}
        <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} />
      </instancedMesh>
    </group>
  )
}
