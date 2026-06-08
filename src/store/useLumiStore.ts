import { create } from 'zustand/index.js';
import type { ChatMessage } from '@/types/models';

interface LumiState {
  messages: ChatMessage[];
  isTyping: boolean;
  llamadasHoy: number;
  isLoading: boolean;

  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTyping: (typing: boolean) => void;
  setLlamadasHoy: (count: number) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useLumiStore = create<LumiState>((set) => ({
  messages: [],
  isTyping: false,
  llamadasHoy: 0,
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages: ChatMessage[]) => set({ messages }),

  setTyping: (isTyping) => set({ isTyping }),

  setLlamadasHoy: (llamadasHoy) => set({ llamadasHoy }),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),

  reset: () =>
    set({ messages: [], isTyping: false, llamadasHoy: 0, isLoading: false }),
}));
