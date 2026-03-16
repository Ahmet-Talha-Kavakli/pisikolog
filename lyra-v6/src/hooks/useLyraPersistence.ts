'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLyraStore } from '@/store/useLyraStore';
import { v4 as uuidv4 } from 'uuid';

export function useLyraPersistence() {
  const sessionId = useLyraStore((state) => state.sessionId);
  const userId = useLyraStore((state) => state.userId);
  const setSessionId = useLyraStore((state) => state.setSessionId);
  const setUserId = useLyraStore((state) => state.setUserId);

  // Initialize session and user
  useEffect(() => {
    const initPersistence = async () => {
      let storedUserId = localStorage.getItem('lyra_user_id');
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem('lyra_user_id', storedUserId);
      }
      setUserId(storedUserId);

      // Create a new session in Supabase for each page load (or session)
      const { data: session, error } = await supabase
        .from('lyra_sessions')
        .insert([{ 
            metadata: { 
                browser: navigator.userAgent,
                platform: navigator.platform
            } 
        }])
        .select()
        .single();

      if (!error && session) {
        setSessionId(session.id);
      } else {
        console.error('Failed to create Lyra session:', error);
      }
    };

    if (!sessionId) {
      initPersistence();
    }
  }, [sessionId, setSessionId, setUserId]);

  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string, emotions: Record<string, number> = {}) => {
    if (!sessionId) return;

    const { error } = await supabase
      .from('lyra_messages')
      .insert([
        {
          session_id: sessionId,
          role,
          content,
          emotions
        },
      ]);

    if (error) {
      console.error('Failed to save message:', error);
    }
  }, [sessionId]);

  const saveMemory = useCallback(async (content: string, emotionalContext: Record<string, number> = {}, importance: number = 1) => {
    if (!userId) return;

    const { error } = await supabase
      .from('lyra_memories')
      .insert([
        {
          user_id: userId,
          content,
          emotional_context: emotionalContext,
          importance
        },
      ]);

    if (error) {
      console.error('Failed to save memory:', error);
    }
  }, [userId]);

  return { saveMessage, saveMemory };
}
