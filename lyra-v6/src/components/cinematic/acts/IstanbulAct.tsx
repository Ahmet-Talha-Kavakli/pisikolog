'use client';

import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

interface IstanbulActProps {
  visible: boolean;
}

const CITY_COUNT = 3000;

function generateCityData(count: number) {
  const cols = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    cols[i * 3] = 0.1 + Math.random() * 0.1; 
    cols[i * 3 + 1] = 0.1 + Math.random() * 0.1; 
    cols[i * 3 + 2] = 0.2 + Math.random() * 0.2;
  }
  return cols;
}

export function IstanbulAct({ visible }: IstanbulActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cityRef = useRef<THREE.InstancedMesh>(null);
  const buildMatRef = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();

  const buildMat = useMemo(() => ({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aColor; varying vec3 vColor; varying float vY;
      void main() {
          vColor = aColor; vY = position.y + 0.5;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime; varying vec3 vColor; varying float vY;
      void main() {
          float flick = step(0.9, sin(gl_FragCoord.y * 0.1 + uTime * 2.0)) * 0.2;
          gl_FragColor = vec4(vColor * (0.8 + flick + vY * 2.5), 1.0);
      }
    `
  }), []);

  const colors = useMemo(() => generateCityData(CITY_COUNT), []);

  useEffect(() => {
    if (cityRef.current) {
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < CITY_COUNT; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        const h = 5 + Math.random() * 30;
        const w = 1 + Math.random() * 3;
        matrix.makeScale(w, h, w);
        matrix.setPosition(x, h / 2, z);
        cityRef.current.setMatrixAt(i, matrix);
      }
      cityRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    if (buildMatRef.current) buildMatRef.current.uniforms.uTime.value = time;
    if (groupRef.current) groupRef.current.rotation.y = time * 0.02;
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={0x070b14} roughness={0.1} metalness={0.8} transparent opacity={0.9} />
      </mesh>

      <group position={[0, 5, 20]}>
        <mesh>
          <boxGeometry args={[100, 1, 6]} />
          <meshStandardMaterial color={0x111111} />
        </mesh>
        <mesh position={[-30, 20, 0]}>
          <boxGeometry args={[2, 40, 2]} />
          <meshStandardMaterial color={0x333333} />
        </mesh>
        <mesh position={[30, 20, 0]}>
          <boxGeometry args={[2, 40, 2]} />
          <meshStandardMaterial color={0x333333} />
        </mesh>
      </group>

      <instancedMesh ref={cityRef} args={[undefined as any, undefined as any, CITY_COUNT]}>
        <boxGeometry args={[1, 1, 1]}>
          <instancedBufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        </boxGeometry>
        <shaderMaterial ref={buildMatRef} attach="material" {...buildMat} />
      </instancedMesh>

      <ambientLight intensity={0.2} />
      <pointLight position={[0, 50, 0]} intensity={1.5} color="#4488ff" />
    </group>
  );
}
