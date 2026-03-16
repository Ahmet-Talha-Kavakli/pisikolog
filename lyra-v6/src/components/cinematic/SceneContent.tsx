'use client';

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import { useLyraStore } from '@/store/useLyraStore';
import { BigBangAct } from './acts/BigBangAct';
import { GalaxyAct } from './acts/GalaxyAct';
import { SaturnAct } from './acts/SaturnAct';
import { EarthAct } from './acts/EarthAct';
import { IstanbulAct } from './acts/IstanbulAct';
import { NeighborhoodAct } from './acts/NeighborhoodAct';
import { HomeAct } from './acts/HomeAct';

export function SceneContent() {
  const scroll = useScroll();
  const setScrollProgress = useLyraStore((state) => state.setScrollProgress);
  const setAct = useLyraStore((state) => state.setAct);
  const currentAct = useLyraStore((state) => state.currentAct);

  useFrame((state) => {
    const progress = scroll.offset;
    setScrollProgress(progress);

    // Act Transition Logic
    let newAct = 1;
    let name = 'BÜYÜK PATLAMA';

    if (progress > 0.1 && progress <= 0.25) { newAct = 2; name = 'GALAKSİ OLUŞUMU'; }
    else if (progress > 0.25 && progress <= 0.4) { newAct = 3; name = 'SATÜRN'; }
    else if (progress > 0.4 && progress <= 0.55) { newAct = 4; name = 'DÜNYA'; }
    else if (progress > 0.55 && progress <= 0.7) { newAct = 5; name = 'İSTANBUL'; }
    else if (progress > 0.7 && progress <= 0.8) { newAct = 6; name = 'REHA SOKAK'; }
    else if (progress > 0.8 && progress <= 0.95) { newAct = 7; name = 'EVDEKİ HUZUR'; }
    else if (progress > 0.95) { newAct = 8; name = 'LYRA İLE TANIŞMA'; }

    if (newAct !== currentAct) {
      setAct(newAct, name);
    }

    // Camera Drive Plane
    if (newAct === 1) {
      state.camera.position.set(0, 0, 165 - (progress * 135));
      state.camera.lookAt(0, 0, 0);
    } else if (newAct === 3) {
      state.camera.position.set(20, 10, 50);
      state.camera.lookAt(0, 0, 0);
    } else if (newAct === 4) {
      const localProgress = (progress - 0.4) * (1 / 0.15);
      state.camera.position.set(0, 0, 150 - localProgress * 120);
      state.camera.lookAt(0, 0, 0);
    } else if (newAct === 5) {
      const localProgress = (progress - 0.55) * (1 / 0.15);
      state.camera.position.set(100 - localProgress * 110, 40 - localProgress * 30, 100 - localProgress * 70);
      state.camera.lookAt(0, 0, 0);
    } else if (newAct === 6) {
      const localProgress = (progress - 0.7) * (1 / 0.1);
      state.camera.position.set(0, 10 - localProgress * 2, 150 - localProgress * 130);
      state.camera.lookAt(-30, 15, -10);
    } else if (newAct === 7) {
      const p = (progress - 0.8) * (1 / 0.15);
      const tremor = (p > 0.4 && p < 0.9) ? Math.sin(state.clock.elapsedTime * 50.0) * 0.05 : 0;
      state.camera.position.set(-8 + tremor, -8 + tremor, (1 - p) * 15 + tremor);
      state.camera.lookAt(-8, -12, -10);
    }
  });

  return (
    <>
      <BigBangAct visible={currentAct === 1} />
      <GalaxyAct visible={currentAct === 2} />
      <SaturnAct visible={currentAct === 3} />
      <EarthAct visible={currentAct === 4} />
      <IstanbulAct visible={currentAct === 5} />
      <NeighborhoodAct visible={currentAct === 6} />
      <HomeAct visible={currentAct === 7} />
    </>
  );
}
