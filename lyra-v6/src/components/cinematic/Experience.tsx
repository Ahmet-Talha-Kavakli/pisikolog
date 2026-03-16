'use client';

import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { SceneContent } from './SceneContent';
import { Loader } from './Loader';
import { TextOverlay } from './TextOverlay';
import { ActIndicator } from './ActIndicator';
import { ScrollProgressBar } from './ScrollProgressBar';
import { PhoneOverlay } from './PhoneOverlay';
import { EmpathyHUD } from './EmpathyHUD';
import { WellnessDashboard } from './WellnessDashboard';
import { useLyraPersistence } from '@/hooks/useLyraPersistence';
import { XR, createXRStore } from '@react-three/xr';

const store = createXRStore();

export function Experience() {
  const [isLoaded, setIsLoaded] = useState(false);
  useLyraPersistence(); // Initialize persistent session

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {!isLoaded && <Loader onLoaded={() => setIsLoaded(true)} />}
      
      <ActIndicator />
      <ScrollProgressBar />
      <TextOverlay />
      <PhoneOverlay />
      <EmpathyHUD />
      <WellnessDashboard />

      <button 
        onClick={() => store.enterAR()}
        className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all active:scale-95 flex items-center gap-2 shadow-2xl"
      >
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        ENTER SPATIAL LYRA
      </button>

      <Canvas
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          logarithmicDepthBuffer: true,
        }}
      >
        <XR store={store}>
          <Suspense fallback={null}>
            <ScrollControls pages={60} damping={0.1}>
              <SceneContent />
            </ScrollControls>
          </Suspense>
        </XR>
      </Canvas>
    </div>
  );
}
