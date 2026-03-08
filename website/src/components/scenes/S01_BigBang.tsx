import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// Basit shader material parçacıklar
const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress; // 0 to 1
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    
    // UscrollProgress arttıkça parçacıklar patlayarak uzaklaşır
    float expansion = uScrollProgress * 800.0 * aSpeed;
    vec3 newPos = position + aRandomDir * expansion;
    
    // Başlangıçta hepsi merkezde toplu
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    // Parçacık boyutu da kameraya yaklaştıkça artar
    gl_PointSize = (aSize * 15.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Yavaşça sönme efekti
    float dist = length(newPos);
    vAlpha = (1.0 - smoothstep(0.0, 1.0, uScrollProgress)) * (1.0 - smoothstep(200.0, 800.0, dist));
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Merkezi daha parlak, kenarları yumuşak daire çizmek
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) discard;
    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    
    gl_FragColor = vec4(vColor, strength * vAlpha);
  }
`;

export default function S01_BigBang() {
  const pointsRef = useRef<THREE.Points>(null)
  
  // THREE.js'in üç boyutlu scroll state objesini alıyoruz
  const scroll = useScroll()

  // 30.000 parçacık (Beyaz küp glitch'ini önlemek için sayıyı düşürüp alpha'yı düzeltiyoruz)
  const count = 30000;

  const [positions, dirstions, colors, sizes, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    const szs = new Float32Array(count)
    const spd = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        const i3 = i * 3

        // Hepsi 0 noktasından(merkezden) başlar
        pos[i3] = (Math.random() - 0.5) * 0.1
        pos[i3 + 1] = (Math.random() - 0.5) * 0.1
        pos[i3 + 2] = (Math.random() - 0.5) * 0.1

        // Küresel bir yön (rastgele)
        const phi = Math.acos((Math.random() * 2) - 1.0)
        const theta = Math.random() * Math.PI * 2
        
        dirs[i3] = Math.cos(theta) * Math.sin(phi)
        dirs[i3 + 1] = Math.sin(theta) * Math.sin(phi)
        dirs[i3 + 2] = Math.cos(phi)

        // Renk paleti: Kozmik mor, koyu mavi ve ateş turuncusu karışımı
        if (Math.random() > 0.5) {
            cols[i3] = 0.5 + Math.random() * 0.5 // R (Violet/Pink)
            cols[i3+1] = 0.2 + Math.random() * 0.3 // G
            cols[i3+2] = 1.0 // B
        } else {
            cols[i3] = 1.0 // R (Orange/Gold)
            cols[i3+1] = 0.6 + Math.random() * 0.4 // G
            cols[i3+2] = 0.2 // B
        }

        szs[i] = Math.random() * 0.5 + 0.1 // Size
        spd[i] = Math.random() * 1.5 + 0.5 // Patlama Hızı
    }

    return [pos, dirs, cols, szs, spd]
  }, [count])

  // Custom shader uniform değerleri
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 }
    }
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
        // Shader time
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
        
        // Scroll 0 ile %10 arasındayken (yani 0 - 0.1 value) Big Bang gerçekleşecek
        // offset objesi genel sayfa scroll yüzdesidir (0-1)
        // Burada offset 0 ile 0.1 arasını izole edeceğiz
        // Scroll 0.02 ile 0.1 arasında (Sayfa 1-4 civarı) Big Bang gerçekleşecek
        const start = 0.02;
        const end = 0.12;
        let p = (scroll.offset - start) / (end - start);
        p = Math.max(0, Math.min(1, p));
        
        pointsRef.current.visible = scroll.offset < 0.15;
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uScrollProgress.value = p
    }
  })

  return (
    <points ref={pointsRef} position={[0, 0, -2000]}>
      <bufferGeometry>
        <bufferAttribute 
            attach="attributes-position" 
            count={count} 
            args={[positions, 3]}
        />
        <bufferAttribute 
            attach="attributes-aRandomDir" 
            count={count} 
            args={[dirstions, 3]}
        />
        <bufferAttribute 
            attach="attributes-aColor" 
            count={count} 
            args={[colors, 3]}
        />
        <bufferAttribute 
            attach="attributes-aSize" 
            count={count} 
            args={[sizes, 1]}
        />
        <bufferAttribute 
            attach="attributes-aSpeed" 
            count={count} 
            args={[speeds, 1]}
        />
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
