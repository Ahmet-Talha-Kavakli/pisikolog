'use client';

import { useEffect, useCallback, useState } from 'react';
import { useLyraStore } from '@/store/useLyraStore';
import { searchMemories } from '@/lib/supabase';

export function useLyraBrain() {
  const emotions = useLyraStore((state) => state.emotions);
  const userId = useLyraStore((state) => state.userId);
  const [isThinking, setIsThinking] = useState(false);
  const [cognitiveInsight, setCognitiveInsight] = useState<string | null>(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  const processEmotionalState = useCallback(async () => {
    // Basic heuristics for "Thinking" triggers
    const highAnxiety = emotions['Anxiety'] > 0.6;
    const highDistress = emotions['Distress'] > 0.6;
    
    if (highAnxiety || highDistress) {
      setIsThinking(true);
      
      // Simulate RAG retrieval: Search memories related to anxiety/calming moments
      // In a real implementation, we'd generate an embedding for "calming techniques"
      // For now, we simulate a vector search with a mock embedding
      const mockQueryEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const relevantMemories = await searchMemories(mockQueryEmbedding, 0.3, 3);
      
      setTimeout(() => {
        setIsThinking(false);
        if (relevantMemories.length > 0) {
          setCognitiveInsight(`Hatırlıyorum... ${relevantMemories[0].content} demiştin. Sakinleşmek için derin bir nefes almayı deneyebiliriz.`);
        } else {
          setCognitiveInsight('Şu an biraz gerginsin. Lyra yanında, her şey yolunda.');
        }
      }, 2000);
    }
  }, [emotions]);

  useEffect(() => {
    // Proactive Greeting upon session stabilization
    if (userId && !hasGreeted) {
        const timeout = setTimeout(() => {
            setIsThinking(true);
            setTimeout(() => {
                setIsThinking(false);
                setCognitiveInsight("Tekrar hoş geldin. Bugün senin için buradayım, nasıl hissediyorsun?");
                setHasGreeted(true);
            }, 1500);
        }, 3000);
        return () => clearTimeout(timeout);
    }
  }, [userId, hasGreeted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      processEmotionalState();
    }, 10000); // Process every 10s for deeper insights
    
    return () => clearTimeout(timer);
  }, [emotions, processEmotionalState]);

  return { isThinking, cognitiveInsight };
}
