'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';

interface NeighborhoodActProps {
  visible: boolean;
}

function generateBuildings(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? 30 + Math.random() * 10 : -30 - Math.random() * 10;
    items.push({
      position: [side, 25, (i - 15) * 35] as [number, number, number],
      hasNeon: Math.random() > 0.7,
      neonColor: Math.random() > 0.5 ? '#ff3333' : '#3333ff',
      neonPos: [side * 0.8, 15 + Math.random() * 10, (i - 15) * 35] as [number, number, number],
      lampPos: [side * 0.4, 15, (i - 15) * 35] as [number, number, number],
    });
  }
  return items;
}

function generateMists(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      position: [(Math.random() - 0.5) * 100, Math.random() * 10, (Math.random() - 0.5) * 200] as [number, number, number],
      rotation: [0, Math.random() * Math.PI, 0] as [number, number, number],
    });
  }
  return items;
}

export function NeighborhoodAct({ visible }: NeighborhoodActProps) {
  const streetRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  const buildings = useMemo(() => generateBuildings(30), []);
  const mists = useMemo(() => generateMists(200), []);

  useFrame((state) => {
    if (!visible) return;
    const time = state.clock.getElapsedTime();
    if (streetRef.current && streetRef.current.material) {
        (streetRef.current.material as THREE.MeshStandardMaterial).opacity = 0.8 + Math.sin(time * 30.0) * 0.1;
    }
  });

  return (
    <group visible={visible}>
      <mesh ref={streetRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color={0x050510} roughness={0.1} metalness={0.8} transparent />
      </mesh>

      {buildings.map((b, i) => (
        <group key={i}>
          <mesh position={b.position}>
            <boxGeometry args={[10, 50, 10]} />
            <meshStandardMaterial color={0x0a0a1a} roughness={0.9} />
          </mesh>
          
          {b.hasNeon && (
            <mesh position={b.neonPos}>
              <boxGeometry args={[0.2, 5, 3]} />
              <meshStandardMaterial color={b.neonColor} emissive={b.neonColor} emissiveIntensity={2} />
            </mesh>
          )}

          <mesh position={b.lampPos}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial color={0xffffaa} />
          </mesh>
          <pointLight position={b.lampPos} color={0xffaa00} intensity={15} distance={30} />
        </group>
      ))}

      {mists.map((m, i) => (
        <mesh key={i} position={m.position} rotation={m.rotation}>
          <boxGeometry args={[20, 1, 20]} />
          <meshStandardMaterial color={0x112233} transparent opacity={0.05} depthWrite={false} />
        </mesh>
      ))}

      <ambientLight intensity={0.1} />
    </group>
  );
}
