import { create } from 'zustand/index.js';
import type { CulturaRegistro, CulturaTipo } from '@/types/models';

interface CulturaState {
  registros: CulturaRegistro[];
  filtroActivo: CulturaTipo | 'todos';
  isLoading: boolean;

  setRegistros: (registros: CulturaRegistro[]) => void;
  setFiltro: (filtro: CulturaTipo | 'todos') => void;
  setLoading: (loading: boolean) => void;
  addRegistro: (registro: CulturaRegistro) => void;
  updateRegistro: (id: string, data: Partial<CulturaRegistro>) => void;
  removeRegistro: (id: string) => void;
  reset: () => void;
}

export const useCulturaStore = create<CulturaState>((set) => ({
  registros: [],
  filtroActivo: 'todos',
  isLoading: false,

  setRegistros: (registros) => set({ registros }),

  setFiltro: (filtroActivo) => set({ filtroActivo }),

  setLoading: (isLoading) => set({ isLoading }),

  addRegistro: (registro) =>
    set((state) => ({ registros: [registro, ...state.registros] })),

  updateRegistro: (id, data) =>
    set((state) => ({
      registros: state.registros.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),

  removeRegistro: (id) =>
    set((state) => ({
      registros: state.registros.filter((r) => r.id !== id),
    })),

  reset: () => set({ registros: [], filtroActivo: 'todos', isLoading: false }),
}));
