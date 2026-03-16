'use client';

import { useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { useLyraStore } from '@/store/useLyraStore';

// In a real production app, these would be in .env
const VAPI_PUBLIC_KEY = 'YOUR_VAPI_PUBLIC_KEY'; 
const VAPI_ASSISTANT_ID = 'YOUR_VAPI_ASSISTANT_ID';

export function useVapi() {
  const vapiRef = useRef<Vapi | null>(null);
  const isVapiConnected = useLyraStore((state) => state.isVapiConnected);
  const setIsVapiConnected = useLyraStore((state) => state.setVapiConnected);

  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
    }

    const vapi = vapiRef.current;

    vapi.on('call-start', () => {
      console.log('Vapi Call Started');
      setIsVapiConnected(true);
    });

    vapi.on('call-end', () => {
      console.log('Vapi Call Ended');
      setIsVapiConnected(false);
    });

    vapi.on('error', (e: Error) => {
      console.error('Vapi Error:', e);
      setIsVapiConnected(false);
    });

    return () => {
      vapi.stop();
    };
  }, [setIsVapiConnected]);

  const toggleCall = useCallback(async () => {
    if (isVapiConnected) {
      vapiRef.current?.stop();
    } else {
      await vapiRef.current?.start(VAPI_ASSISTANT_ID);
    }
  }, [isVapiConnected]);

  return { toggleCall, isVapiConnected };
}
