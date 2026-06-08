import { create } from 'zustand/index.js';
import type { Foto } from '@/types/models';

interface FotosState {
  fotos: Foto[];
  isLoading: boolean;

  setFotos: (fotos: Foto[]) => void;
  setLoading: (loading: boolean) => void;
  addFoto: (foto: Foto) => void;
  removeFoto: (id: string) => void;
  reset: () => void;
}

export const useFotosStore = create<FotosState>((set) => ({
  fotos: [],
  isLoading: false,

  setFotos: (fotos) => set({ fotos }),

  setLoading: (isLoading) => set({ isLoading }),

  addFoto: (foto) =>
    set((state) => ({ fotos: [foto, ...state.fotos] })),

  removeFoto: (id) =>
    set((state) => ({ fotos: state.fotos.filter((f) => f.id !== id) })),

  reset: () => set({ fotos: [], isLoading: false }),
}));
