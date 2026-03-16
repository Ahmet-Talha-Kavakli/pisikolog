import { create } from 'zustand';

interface LyraState {
  currentAct: number;
  actName: string;
  scrollProgress: number;
  isMuted: boolean;
  isVapiConnected: boolean;
  phoneProgress: number;
  phoneState: string;
  emotions: Record<string, number>;
  sessionId: string | null;
  userId: string | null;
  
  setAct: (act: number, name: string) => void;
  setScrollProgress: (progress: number) => void;
  toggleMute: () => void;
  setVapiConnected: (connected: boolean) => void;
  setPhoneData: (progress: number, state: string) => void;
  setEmotions: (emotions: Record<string, number>) => void;
  setSessionId: (id: string) => void;
  setUserId: (id: string) => void;
}

export const useLyraStore = create<LyraState>((set) => ({
  currentAct: 1,
  actName: 'BIG BANG',
  scrollProgress: 0,
  isMuted: true,
  isVapiConnected: false,
  phoneProgress: 0,
  phoneState: 'hidden',
  emotions: {},
  sessionId: null,
  userId: null,

  setAct: (act, name) => set({ currentAct: act, actName: name }),
  setScrollProgress: (progress) => set({ scrollProgress: progress }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVapiConnected: (connected) => set({ isVapiConnected: connected }),
  setPhoneData: (progress, state) => set({ phoneProgress: progress, phoneState: state }),
  setEmotions: (emotions) => set({ emotions }),
  setSessionId: (id) => set({ sessionId: id }),
  setUserId: (id) => set({ userId: id }),
}));
