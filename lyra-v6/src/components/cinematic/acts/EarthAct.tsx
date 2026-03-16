'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

interface EarthActProps {
  visible: boolean;
}

const TRAIL_COUNT = 6000;

function generateEarthTrails(count: number) {
  const pos = new Float32Array(count * 3);
  const vels = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const phi = Math.random() * 6.28; 
    const theta = Math.random() * 6.28;
    const r = 10.5 + Math.random() * 80;
    
    const idx = i * 3;
    pos[idx] = r * Math.sin(theta) * Math.cos(phi); 
    pos[idx + 1] = r * Math.sin(theta) * Math.sin(phi); 
    pos[idx + 2] = r * Math.cos(theta);
    
    vels[idx] = -pos[idx] * 0.2;
    vels[idx + 1] = -pos[idx + 1] * 0.2;
    vels[idx + 2] = -pos[idx + 2] * 0.2;
  }
  return { pos, vels };
}

export function EarthAct({ visible }: EarthActProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const earthMatRef = useRef<THREE.ShaderMaterial>(null);
  const trailMatRef = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();

  const earthMat = useMemo(() => ({
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
        vec3 ocean = vec3(0.05, 0.1, 0.25); vec3 land = vec3(0.1, 0.2, 0.15); 
        float m = sin(vUv.x * 20.0 + sin(vUv.y * 10.0)) * cos(vUv.y * 20.0) * 0.5 + 0.5; 
        vec3 col = mix(ocean, land, smoothstep(0.4, 0.6, m)); 
        gl_FragColor = vec4(col + vec3(0.4, 0.6, 1.0) * fr, 1.0); 
      }
    `
  }), []);

  const { pos: trailPositions, vels: trailVelocities } = useMemo(() => generateEarthTrails(TRAIL_COUNT), []);

  const trailMat = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uProgress: { value: 0 } },
    vertexShader: `
      uniform float uTime; uniform float uProgress; attribute vec3 aVelocity; 
      void main() { 
        vec3 p = position + aVelocity * uProgress; 
        vec4 mv = modelViewMatrix * vec4(p, 1.0); 
        gl_PointSize = (2.0 + sin(uTime * 2.0 + position.x * 10.0)) * (300.0 / -mv.z); 
        gl_Position = projectionMatrix * mv; 
      }
    `,
    fragmentShader: `
      void main() { gl_FragColor = vec4(1.0, 0.4, 0.1, 0.8); if (length(gl_PointCoord-0.5)>0.5) discard; }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    const progress = (scroll.offset - 0.4) * (1 / 0.15);
    const clampedProgress = Math.max(0, Math.min(1.0, progress));

    if (earthMatRef.current) earthMatRef.current.uniforms.uTime.value = time;
    if (trailMatRef.current) {
        trailMatRef.current.uniforms.uTime.value = time;
        trailMatRef.current.uniforms.uProgress.value = clampedProgress;
    }

    if (earthRef.current) earthRef.current.rotation.y = time * 0.1;
  });

  return (
    <group visible={visible}>
      <mesh ref={earthRef}>
        <icosahedronGeometry args={[10, 64]} />
        <shaderMaterial ref={earthMatRef} attach="material" {...earthMat} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={TRAIL_COUNT} array={trailPositions} itemSize={3} />
          <bufferAttribute attach="attributes-aVelocity" count={TRAIL_COUNT} array={trailVelocities} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial ref={trailMatRef} attach="material" {...trailMat} />
      </points>

      <ambientLight intensity={0.4} />
      <pointLight position={[50, 50, 50]} intensity={2} color="#ffffff" />
    </group>
  );
}
