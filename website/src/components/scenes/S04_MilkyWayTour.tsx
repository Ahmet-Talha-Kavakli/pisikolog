import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// İçinde uçarken yıldızların ve toz bulutlarının yavaşça etrafımızdan geçtiği shader
const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress; // 0.3 to 0.45
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec3 newPos = position;
    
    // Yavaşça bize doğru sürüklenen yıldızlar ve hafif rotasyon
    float angle = uTime * 0.1 * aSpeed;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    newPos.xy *= rot;

    // Kameraya doğru ilerleme
    newPos.z += uScrollProgress * 1000.0 * aSpeed;
    
    // Sonsuz döngü (kameranın arkasına geçeni öne at)
    if (newPos.z > 50.0) {
      newPos.z -= 1000.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    gl_PointSize = (aSize * 25.0) * (1.0 / -mvPosition.z) * (1.0 + uScrollProgress * 2.0);
    gl_Position = projectionMatrix * mvPosition;

    // Uzakta silik, yakında belirgin ama fade out
    float zFade = smoothstep(-1000.0, -500.0, newPos.z) * (1.0 - smoothstep(0.0, 50.0, newPos.z));
    vAlpha = smoothstep(0.0, 0.2, uScrollProgress) * (1.0 - smoothstep(0.8, 1.0, uScrollProgress)) * zFade;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Yumuşak dairesel veya bulutsu parçacıklar
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    
    gl_FragColor = vec4(vColor, strength * vAlpha);
  }
`;

export default function S04_MilkyWayTour() {
  const pointsRef = useRef<THREE.Points>(null)
  const scroll = useScroll()

  const count = 40000;

  const [positions, dirstions, colors, sizes, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    const szs = new Float32Array(count)
    const spd = new Float32Array(count)

    // Perlin noise algımız olmadığı için yoğunluk merkezleri oluşturarak bulut hissi verelim
    const nebulaCenters = [
      { x: 50, y: 20, z: -300, color: [0.8, 0.2, 0.5] }, // Pembe nebula
      { x: -60, y: -40, z: -600, color: [0.2, 0.4, 0.8] }, // Mavi nebula
      { x: 20, y: -50, z: -800, color: [0.9, 0.6, 0.1] } // Turuncu nebula
    ]

    for (let i = 0; i < count; i++) {
        const i3 = i * 3

        let center = { x: 0, y: 0, z: 0 };
        let baseColor = [1.0, 1.0, 1.0];
        
        // %30 şansla bir nebula merkezine yakınlaşır
        if(Math.random() < 0.3) {
            const rnebula = nebulaCenters[Math.floor(Math.random() * nebulaCenters.length)];
            center = rnebula;
            baseColor = rnebula.color;
        }

        pos[i3] = center.x + (Math.random() - 0.5) * 400
        pos[i3 + 1] = center.y + (Math.random() - 0.5) * 400
        pos[i3 + 2] = center.z + (Math.random() - 0.5) * 1000

        dirs[i3] = (Math.random() - 0.5)
        dirs[i3 + 1] = (Math.random() - 0.5)
        dirs[i3 + 2] = (Math.random() - 0.5)

        // Renk
        cols[i3] = baseColor[0] * (Math.random() * 0.5 + 0.5);
        cols[i3+1] = baseColor[1] * (Math.random() * 0.5 + 0.5); 
        cols[i3+2] = baseColor[2] * (Math.random() * 0.5 + 0.5); 

        szs[i] = Math.random() * 1.5 + 0.2 
        spd[i] = Math.random() * 0.5 + 0.5 // Yavaş, huzurlu dönüş
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
        
        const start = 0.45;
        const end = 0.60;
        let sceneProgress = (scroll.offset - start) / (end - start);
        sceneProgress = Math.max(0, Math.min(1, sceneProgress));

        pointsRef.current.visible = scroll.offset > 0.4 && scroll.offset < 0.65;
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uScrollProgress.value = sceneProgress
    }
  })

  return (
    <points ref={pointsRef} position={[0, 0, -22000]}>
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
