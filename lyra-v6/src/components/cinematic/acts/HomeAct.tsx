'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useLyraStore } from '@/store/useLyraStore';

interface HomeActProps {
  visible: boolean;
}

const PARTICLE_COUNT = 5000;

function generateParticlePositions(count: number) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  return pos;
}

function generateClutterItems(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      size: [1 + Math.random(), 1, 1 + Math.random()] as [number, number, number],
      position: [(Math.random() - 0.5) * 30, -14, (Math.random() - 0.5) * 50] as [number, number, number],
      rotation: [0, Math.random() * Math.PI, 0] as [number, number, number]
    });
  }
  return items;
}

export function HomeAct({ visible }: HomeActProps) {
  const roomRef = useRef<THREE.Mesh>(null);
  const pntLightRef = useRef<THREE.PointLight>(null);
  const flickerLightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);
  
  const scroll = useScroll();
  const setPhoneData = useLyraStore((state) => state.setPhoneData);
  const emotions = useLyraStore((state) => state.emotions);

  const particlePositions = useMemo(() => generateParticlePositions(PARTICLE_COUNT), []);
  const clutterItems = useMemo(() => generateClutterItems(15), []);

  useFrame((state) => {
    if (!visible) {
        setPhoneData(0, 'hidden');
        return;
    }
    const time = state.clock.getElapsedTime();
    const progress = (scroll.offset - 0.8) * (1 / 0.15);
    const clampedProgress = Math.max(0, Math.min(1.0, progress));

    // Emotional mapping
    const calmness = emotions['Calmness'] || 0;
    const joy = emotions['Joy'] || 0;

    if (particlesRef.current) {
        particlesRef.current.rotation.y = time * 0.05;
        const targetColor = new THREE.Color(0x220000); 
        if (calmness > 0.5) targetColor.set(0x001122);
        if (joy > 0.5) targetColor.set(0x222200);
        if (particleMatRef.current) {
            particleMatRef.current.color.lerp(targetColor, 0.05);
        }
    }

    if (pntLightRef.current) {
        pntLightRef.current.intensity = 1.5 + Math.sin(time * 5.0) * 0.5;
        const lightCol = new THREE.Color(0xff3344);
        if (calmness > 0.5) lightCol.set(0x4488ff);
        if (joy > 0.5) lightCol.set(0xffcc44);
        pntLightRef.current.color.lerp(lightCol, 0.05);
    }

    // Phone UI logic
    if (clampedProgress > 0.6) {
        let phoneState = 'ig';
        const p = (clampedProgress - 0.6) / 0.4;
        if (p < 0.3) phoneState = 'ig';
        else if (p < 0.5) phoneState = 'ig_comments';
        else if (p < 0.65) phoneState = 'ig_negative';
        else if (p < 0.8) phoneState = 'lyra_ad';
        else if (p < 0.95) phoneState = 'appstore';
        else phoneState = 'app_open';
        
        setPhoneData(p, phoneState);
    } else {
        setPhoneData(0, 'hidden');
    }
  });

  return (
    <group visible={visible}>
      <mesh ref={roomRef}>
        <boxGeometry args={[40, 30, 60]} />
        <meshStandardMaterial color={0x0a0a14} side={THREE.BackSide} roughness={0.9} metalness={0.1} />
      </mesh>

      <mesh position={[-8, -13, -10]}>
        <boxGeometry args={[12, 2, 20]} />
        <meshStandardMaterial color={0x151525} roughness={0.9} />
      </mesh>

      {clutterItems.map((item, i) => (
        <mesh key={i} position={item.position} rotation={item.rotation}>
          <boxGeometry args={item.size} />
          <meshStandardMaterial color={0x050510} />
        </mesh>
      ))}

      <group position={[-8, -12, -10]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[1, 4, 4, 8]} />
          <meshStandardMaterial color={0x1a1a2a} />
        </mesh>
      </group>

      <pointLight ref={pntLightRef} position={[0, 10, 0]} color={0xff3344} distance={40} />
      <pointLight ref={flickerLightRef} position={[-5, -10, -5]} color={0xaaccff} distance={20} />

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial ref={particleMatRef} color={0x220000} size={0.2} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </points>

      <ambientLight intensity={0.05} />
    </group>
  );
}
