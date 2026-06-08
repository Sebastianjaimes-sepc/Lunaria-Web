import { create } from 'zustand/index.js';
import type { Viaje, ViajeEstado } from '@/types/models';

interface ViajesState {
  viajes: Viaje[];
  filtroEstado: ViajeEstado | 'todos';
  isLoading: boolean;

  setViajes: (viajes: Viaje[]) => void;
  setFiltro: (filtro: ViajeEstado | 'todos') => void;
  setLoading: (loading: boolean) => void;
  addViaje: (viaje: Viaje) => void;
  updateViaje: (id: string, data: Partial<Viaje>) => void;
  removeViaje: (id: string) => void;
  reset: () => void;
}

export const useViajesStore = create<ViajesState>((set) => ({
  viajes: [],
  filtroEstado: 'todos',
  isLoading: false,

  setViajes: (viajes) => set({ viajes }),

  setFiltro: (filtroEstado) => set({ filtroEstado }),

  setLoading: (isLoading) => set({ isLoading }),

  addViaje: (viaje) =>
    set((state) => ({ viajes: [viaje, ...state.viajes] })),

  updateViaje: (id, data) =>
    set((state) => ({
      viajes: state.viajes.map((v) => (v.id === id ? { ...v, ...data } : v)),
    })),

  removeViaje: (id) =>
    set((state) => ({ viajes: state.viajes.filter((v) => v.id !== id) })),

  reset: () => set({ viajes: [], filtroEstado: 'todos', isLoading: false }),
}));
