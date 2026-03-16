'use client';

import { useEffect, useCallback } from 'react';
import { useLyraStore } from '@/store/useLyraStore';
import { useLyraPersistence } from './useLyraPersistence';

// We will use a mock implementation or standard WebSocket if Hume SDK isn't fully ready in this env
// But the architecture will be ready for the HUME_API_KEY
export function useHumeAI() {
  const setEmotions = useLyraStore((state) => state.setEmotions);
  const vapiConnected = useLyraStore((state) => state.isVapiConnected);
  const { saveMessage, saveMemory } = useLyraPersistence();

  const connectHume = useCallback(() => {
    // In a real scenario, we'd use hume.voice.connect()
    // For now, let's setup the architecture to receive emotion bundles
    console.log("Hume AI: Connecting to Empathic Voice Interface...");
  }, []);

  const handleEmotionUpdate = useCallback((emotions: Record<string, number>, content?: string) => {
    setEmotions(emotions);
    
    // Periodically save or save on content (text transcription)
    if (content) {
      saveMessage('assistant', content, emotions);
    }

    // Heuristic: If any emotion > 0.8, save as a significant Memory
    const topEmotions = Object.entries(emotions)
      .filter(([, val]) => val > 0.8)
      .sort((a, b) => b[1] - a[1]);

    if (topEmotions.length > 0) {
      saveMemory(`Duygusal Pik: ${topEmotions[0][0]}`, emotions, 5);
    }
  }, [setEmotions, saveMessage, saveMemory]);

  useEffect(() => {
    if (vapiConnected) {
      connectHume();
    } else {
      // Disconnect if needed
    }
  }, [vapiConnected, connectHume]);

  return { handleEmotionUpdate };
}
