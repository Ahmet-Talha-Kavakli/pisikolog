'use client';

import { useLyraStore } from '@/store/useLyraStore';

export function ScrollProgressBar() {
  const scrollProgress = useLyraStore((state) => state.scrollProgress);

  return (
    <div 
      className="scroll-progress-bar" 
      style={{ width: `${scrollProgress * 100}%` }}
    />
  );
}
