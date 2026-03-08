import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

// Parçacık Shader (Aynı mantık, farklı shader)
const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress; // 0.1 to 0.2
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    
    // Yalnızca uScrollProgress kendi aralığına girdiğinde parçacıklar genişler
    // Ancak galaksiler spiral bir hareketle büyür.
    
    // Rotasyon matrisi
    float angle = uScrollProgress * 5.0 * aSpeed;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    
    vec3 newPos = position;
    newPos.xz *= rot;
    
    // Merkezkaç ile yayılma
    newPos += aRandomDir * (uScrollProgress * 50.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    gl_PointSize = (aSize * 20.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    // Uzaktaki/yeni oluşan galaksiler için fadeIn
    vAlpha = smoothstep(0.0, 0.5, uScrollProgress) * (1.0 - smoothstep(0.5, 1.0, uScrollProgress));
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    float strength = 0.05 / distanceToCenter - 0.1;
    strength = clamp(strength, 0.0, 1.0);
    
    gl_FragColor = vec4(vColor, strength * vAlpha);
  }
`;

export default function S02_GalaxyFormation() {
  const pointsRef = useRef<THREE.Points>(null)
  const scroll = useScroll()

  // 10 galaksi, her birinde 20.000 yıldız parçası 
  const numGalaxies = 10;
  const starsPerGalaxy = 20000;
  const count = numGalaxies * starsPerGalaxy;

  const [positions, dirstions, colors, sizes, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    const szs = new Float32Array(count)
    const spd = new Float32Array(count)

    // Galaksi merkezleri uzayda dağınık yerleştirilir
    const galaxyCenters = []
    for(let g=0; g<numGalaxies; g++) {
        galaxyCenters.push({
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 200 - 100 // Daha geride başlasın
        })
    }

    let i = 0;
    for (let g = 0; g < numGalaxies; g++) {
        const center = galaxyCenters[g];
        
        // Renk paleti per galaxy
        const baseColorScale = Math.random();

        for (let s = 0; s < starsPerGalaxy; s++) {
            const i3 = i * 3

            // Spiral matematik (logaritmik)
            const radius = Math.random() * Math.random() * 20.0 // merkeze daha yoğun
            const theta = radius * 3.0 + Math.random() * 0.5; // Spiral kollar
            
            // XZ düzleminde disk oluştur
            pos[i3] = center.x + Math.cos(theta) * radius
            pos[i3 + 1] = center.y + (Math.random() - 0.5) * 2.0 // İnce disk kalınlığı
            pos[i3 + 2] = center.z + Math.sin(theta) * radius

            dirs[i3] = Math.cos(theta)
            dirs[i3 + 1] = 0.0
            dirs[i3 + 2] = Math.sin(theta)

            if (baseColorScale < 0.3) {
                // Mavi Galaksi
                cols[i3] = 0.5; cols[i3+1] = 0.7; cols[i3+2] = 1.0;
            } else if (baseColorScale > 0.7) {
                // Turuncu/Kızıl Galaksi
                cols[i3] = 1.0; cols[i3+1] = 0.5; cols[i3+2] = 0.2;
            } else {
                // Beyaz/Sarımsı disk (Samanyolu stili)
                cols[i3] = 1.0; cols[i3+1] = 0.9; cols[i3+2] = 0.7;
            }

            szs[i] = Math.random() * 0.8 + 0.1
            spd[i] = Math.random() * 0.5 + 0.5
            i++;
        }
    }

    return [pos, dirs, cols, szs, spd]
  }, [count, numGalaxies, starsPerGalaxy])

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uScrollProgress: { value: 0 }
    }
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
        
        // Galaksiler 0.12 ile 0.35 sahnede görünecek.
        const start = 0.12;
        const end = 0.35;
        let sceneProgress = (scroll.offset - start) / (end - start);
        sceneProgress = Math.max(0, Math.min(1, sceneProgress));

        pointsRef.current.visible = scroll.offset > 0.1 && scroll.offset < 0.4;
        (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uScrollProgress.value = sceneProgress
    }
  })

  return (
    <points ref={pointsRef} position={[0, 0, -8000]}>
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
