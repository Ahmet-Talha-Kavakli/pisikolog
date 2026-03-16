'use client';

import { useLyraStore } from '@/store/useLyraStore';

export function ActIndicator() {
  const actName = useLyraStore((state) => state.actName);

  return (
    <div className="act-indicator">
      {actName}
    </div>
  );
}
