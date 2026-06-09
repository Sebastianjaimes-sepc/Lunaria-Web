import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useCulturaStore } from '@/store/useCulturaStore';
import { useViajesStore } from '@/store/useViajesStore';
import { useFotosStore } from '@/store/useFotosStore';
import { getProfile } from '@/services/authService';
import { getCulturaRegistros } from '@/services/culturaService';
import { getViajes } from '@/services/viajesService';
import { getFotos } from '@/services/fotosService';
import { useLumiStore } from '@/store/useLumiStore';

export function useAuth() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();
  const setRegistros = useCulturaStore((s) => s.setRegistros);
  const setViajes = useViajesStore((s) => s.setViajes);
  const setFotos = useFotosStore((s) => s.setFotos);
  const resetLumi = useLumiStore((s) => s.reset);

  useEffect(() => {
    // Mostrar app inmediatamente sin bloquear
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
      setLoading(false);

      // Cargar datos en background sin bloquear la UI
      if (session?.user) {
        getProfile(session.user.id).then(setProfile).catch(() => {});
        getCulturaRegistros(session.user.id).then(setRegistros).catch(() => {});
        getViajes(session.user.id).then(setViajes).catch(() => {});
        getFotos(session.user.id).then(setFotos).catch(() => {});
      }
    }).catch(() => {
      setInitialized(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          getProfile(session.user.id).then(setProfile).catch(() => {});
          getCulturaRegistros(session.user.id).then(setRegistros).catch(() => {});
          getViajes(session.user.id).then(setViajes).catch(() => {});
          getFotos(session.user.id).then(setFotos).catch(() => {});
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRegistros([]);
          setViajes([]);
          setFotos([]);
          resetLumi();
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, [setSession, setProfile, setLoading, setInitialized, setRegistros, setViajes, setFotos, resetLumi]);
}