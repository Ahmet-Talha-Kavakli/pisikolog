import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// Parçacık Shader: Warp ve Yıldız Çizgileri
const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress; // 0.2 to 0.3
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec3 newPos = position;
    
    // Z ekseninde kameraya doğru hızla gelirler (scroll + zaman bağlantılı)
    float baseMovement = mod((position.z + uTime * 50.0 * aSpeed * uScrollProgress * 5.0), 1000.0) - 500.0;
    
    // Scroll ilerledikçe z pozisyonu streak (çizgi) şeklini alır
    newPos.z = baseMovement;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    // Parçacık boyutu da kameraya yaklaştıkça artar
    // Warp speed için boyutu bir miktar Z derinliğine doğru stretch ediyoruz
    gl_PointSize = (aSize * 25.0) * (1.0 / -mvPosition.z) * (1.0 + uScrollProgress * 5.0);
    gl_Position = projectionMatrix * mvPosition;

    // Sadece bu scroll aralığında görünmesi için alpha blending
    vAlpha = smoothstep(0.0, 0.2, uScrollProgress) * (1.0 - smoothstep(0.8, 1.0, uScrollProgress));
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Merkezi parlak, motion blur'lu (çizgi şeklinde) yıldızlar
    // X ekseninde daraltıp Y ekseninde (veya kameraya doğru uzayan) streak etkisi yaratırız
    
    vec2 p = gl_PointCoord - 0.5;
    
    // Dikeyden biraz eliptik (çizgi efekti)
    float distanceToCenter = length(vec2(p.x * 2.0, p.y * 0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    
    gl_FragColor = vec4(vColor, strength * vAlpha);
  }
`;

export default function S03_MilkyWayApproach() {
  const pointsRef = useRef<THREE.Points>(null)
  const scroll = useScroll()

  const count = 30000; // warp speed yıldızları

  const [positions, dirstions, colors, sizes, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    const szs = new Float32Array(count)
    const spd = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        const i3 = i * 3

        // Silindirik/Tüp şeklinde etrafımızı saracak şekilde
        const radius = Math.random() * 200 + 10;
        const theta = Math.random() * Math.PI * 2;
        
        pos[i3] = Math.cos(theta) * radius
        pos[i3 + 1] = Math.sin(theta) * radius
        // z pozisyonu geniş bir aralığa yayılmış durumda
        pos[i3 + 2] = (Math.random() - 0.5) * 1000

        dirs[i3] = 0 // Warp shader halledecek
        dirs[i3 + 1] = 0
        dirs[i3 + 2] = Math.random() * 2.0 + 1.0

        // Yıldızlar daha mavi/soğuk parlak renkte
        cols[i3] = Math.random() * 0.5 + 0.5;
        cols[i3+1] = Math.random() * 0.5 + 0.5; 
        cols[i3+2] = 1.0; 

        szs[i] = Math.random() * 0.5 + 0.1 
        spd[i] = Math.random() * 2.0 + 3.0 // çok hızlı
    }

    return [pos, dirs, cols, szs, spd]
  }, [count])

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 }
    }
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
        
        // Bu sahne offset 0.3'te başlar
        const start = 0.3;
        const end = 0.45;
        let sceneProgress = (scroll.offset - start) / (end - start);
        sceneProgress = Math.max(0, Math.min(1, sceneProgress));

        pointsRef.current.visible = scroll.offset > 0.25 && scroll.offset < 0.5;
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uScrollProgress.value = sceneProgress
    }
  })

  return (
    <points ref={pointsRef} position={[0, 0, -15000]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRandomDir" count={count} args={[dirstions, 3]} />
        <bufferAttribute attach="attributes-aColor" count={count} args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" count={count} args={[sizes, 1]} />
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
  )
}
