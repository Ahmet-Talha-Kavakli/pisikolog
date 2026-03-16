'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

interface SaturnActProps {
  visible: boolean;
}

const ICE_COUNT = 60000;

function generateSaturnIce(count: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 15.5 + Math.random() * 12; 
    const a = Math.random() * 6.28;
    pos[i * 3] = Math.cos(a) * r; 
    pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2; 
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  return pos;
}

export function SaturnAct({ visible }: SaturnActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const iceRef = useRef<THREE.Points>(null);
  const planetMatRef = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();

  const planetMat = useMemo(() => ({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; 
      void main() { 
        vUv = uv; vN = normalize(normalMatrix * normal); 
        vec4 wp = modelViewMatrix * vec4(position, 1.0); vV = normalize(-wp.xyz); 
        gl_Position = projectionMatrix * wp; 
      }
    `,
    fragmentShader: `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; uniform float uTime; 
      void main() { 
        float fr = pow(1.1 - dot(vV, vN), 3.0); 
        float bands = sin(vUv.y * 50.0 + sin(vUv.x * 5.0 + uTime * 0.1) * 2.0) * 0.05 + 0.5; 
        vec3 col = mix(vec3(0.9, 0.8, 0.6), vec3(0.7, 0.6, 0.4), bands); 
        gl_FragColor = vec4(col + vec3(0.2, 0.1, 0.3) * fr, 1.0); 
      }
    `
  }), []);

  const icePositions = useMemo(() => generateSaturnIce(ICE_COUNT), []);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    if (planetMatRef.current) planetMatRef.current.uniforms.uTime.value = time;
    if (planetRef.current) planetRef.current.rotation.y = time * 0.05;
    if (iceRef.current) iceRef.current.rotation.y = time * 0.02;
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh ref={planetRef}>
        <icosahedronGeometry args={[12, 64]} />
        <shaderMaterial ref={planetMatRef} attach="material" {...planetMat} />
      </mesh>

      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <ringGeometry args={[15, 28, 128]} />
        <meshStandardMaterial color={0x888877} side={THREE.DoubleSide} transparent opacity={0.7} roughness={0.3} metalness={0.5} />
      </mesh>

      <points ref={iceRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={ICE_COUNT} array={icePositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={0xccffff} size={0.05} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </points>

      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />
    </group>
  );
}
