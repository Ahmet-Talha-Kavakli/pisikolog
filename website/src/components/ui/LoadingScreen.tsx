"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onStarted: () => void;
}

export default function LoadingScreen({ onStarted }: LoadingScreenProps) {
  const { progress } = useProgress();
  const [show, setShow] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
    
    // Fallback if loading takes too long or useProgress is stuck
    const fallbackTimer = setTimeout(() => setIsReady(true), 5000);
    return () => clearTimeout(fallbackTimer);
  }, [progress]);

  const handleStart = () => {
    setShow(false);
    onStarted();
  };

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${isReady ? 'opacity-100' : 'opacity-100'}`}>
      <div className="relative w-64 h-[1px] bg-white/10 mb-8 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      <div className="flex flex-col items-center">
        <h2 className="text-white text-xs uppercase tracking-[0.5em] mb-4 font-light animate-pulse">
            {isReady ? "Ready for Journey" : `Loading Universe ${Math.round(progress)}%`}
        </h2>
        
        {isReady && (
            <button 
                onClick={handleStart}
                className="mt-4 px-8 py-3 bg-white text-black text-xs uppercase tracking-[0.3em] font-bold hover:bg-transparent hover:text-white border border-white transition-all duration-300"
            >
                Enter Lyra
            </button>
        )}
      </div>
    </div>
  );
}
