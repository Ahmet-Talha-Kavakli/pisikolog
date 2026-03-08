import * as THREE from 'three'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  
  // High quality procedural noise for continents
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    float n = 0.0;
    n += 0.5000 * noise(vUv * 4.0);
    n += 0.2500 * noise(vUv * 8.0);
    n += 0.1250 * noise(vUv * 16.0);
    
    vec3 ocean = vec3(0.05, 0.15, 0.4);
    vec3 land = vec3(0.1, 0.3, 0.1);
    vec3 ice = vec3(0.9, 0.9, 1.0);
    
    vec3 color = mix(ocean, land, smoothstep(0.45, 0.55, n));
    color = mix(color, ice, smoothstep(0.7, 0.8, n));
    
    // Fresnel shadow
    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
    color *= (1.0 - intensity);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  uniform vec3 color;
  uniform float opacity;
  void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 6.0);
    gl_FragColor = vec4(color, 1.0) * intensity * opacity;
  }
`;

export default function S06_EarthApproach() {
  const earthGroupRef = useRef<THREE.Group>(null)
  const earthMeshRef = useRef<THREE.Mesh>(null)
  const cloudsMeshRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  
  const scroll = useScroll()

  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(0.2, 0.6, 1.0) }, // Açık mavi atmosfer
    opacity: { value: 1.0 }
  }), [])

  useFrame((state, delta) => {
    // Dünya ve bulut rotasyonu
    if (earthMeshRef.current) earthMeshRef.current.rotation.y += delta * 0.05
    if (cloudsMeshRef.current) cloudsMeshRef.current.rotation.y += delta * 0.07

    // Add rotational movement
    if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.002;
    }

    // 0.75 ile 0.88 arasında Dünya'ya yaklaşma ve atmosferine girme
    const start = 0.75
    const end = 0.88
    let p = (scroll.offset - start) / (end - start)
    p = Math.max(0, Math.min(1, p))

    if (earthGroupRef.current) {
        earthGroupRef.current.visible = scroll.offset > 0.7 && scroll.offset < 0.92;

        // Logaritmik/Üstel büyüme ile atmosferin içine dalıyormuşuz hissi
        // Küre bizi yutmalı (böylece S07_CountryDescent'a geçebiliriz)
        const s = 1.0 + (p * p * p * 80.0)
        earthGroupRef.current.scale.set(s, s, s)

        // Yaklaştıkça etrafı siyaha değil, atmosfere bulayarak fadeout yapabiliriz
        // Bunu şimdilik shader'ın opacity'sini ayarlayarak veya kameranın clipping ucuyla oynayacağız.
        
        // Şimdilik grup biraz aşağıda dursun ki, kıta hissini ekranda görelim
        earthGroupRef.current.position.y = -p * 20.0
        
        // Eğer çok yaklaştıysak opacity'i düşürüp pürüzsüz geçiş
        if (p > 0.9 && atmosphereRef.current) {
           (atmosphereRef.current.material as THREE.ShaderMaterial).uniforms.opacity.value = (1.0 - p) * 10.0;
        } else if (atmosphereRef.current) {
           (atmosphereRef.current.material as THREE.ShaderMaterial).uniforms.opacity.value = 1.0;
        }
    }
  })

  return (
    <group ref={earthGroupRef} position={[0, -20, -38000]}>
      {/* Dünya Küresi - Texture olmadığı için okyanus mavisi */}
      <mesh ref={earthMeshRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <shaderMaterial 
            vertexShader={earthVertexShader}
            fragmentShader={earthFragmentShader}
        />
      </mesh>

      {/* Bulut Katmanı */}
      <mesh ref={cloudsMeshRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial 
            color="#ffffff" 
            transparent={true} 
            opacity={0.4} 
            roughness={1}
            blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Atmosfer Şişkinliği (Glow Shader) */}
      <mesh ref={atmosphereRef} scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[5, 64, 64]} />
        <shaderMaterial 
            vertexShader={atmosphereVertexShader}
            fragmentShader={atmosphereFragmentShader}
            uniforms={uniforms}
            transparent={true}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
        />
      </mesh>
      
    </group>
  )
}
