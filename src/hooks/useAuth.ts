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

/**
 * Inicializa la sesión y pre-carga todos los datos al arrancar.
 * Así el Home muestra contadores reales sin que Luisa tenga que
 * abrir cada tab primero.
 */
export function useAuth() {
  const { setSession, setProfile, setLoading, setInitialized } = useAuthStore();
  const setRegistros = useCulturaStore((s) => s.setRegistros);
  const setViajes = useViajesStore((s) => s.setViajes);
  const setFotos = useFotosStore((s) => s.setFotos);
  const resetLumi = useLumiStore((s) => s.reset);

  useEffect(() => {
    setLoading(true);

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 5000));

    Promise.race([
      supabase.auth.getSession(),
      timeoutPromise
    ]).then((result: any) => {
      const session = result?.data?.session ?? null;
      setSession(session);
      setInitialized(true);
      setLoading(false);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const [profile, registros, viajes, fotos] = await Promise.all([
              getProfile(session.user.id),
              getCulturaRegistros(session.user.id),
              getViajes(session.user.id),
              getFotos(session.user.id),
            ]);
            setProfile(profile);
            setRegistros(registros);
            setViajes(viajes);
            setFotos(fotos);
          } catch {
            setProfile(null);
          }
        }, 0);
      }
    }).catch(() => {
      setInitialized(true);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          try {
            const [profile, registros, viajes, fotos] = await Promise.all([
              getProfile(session.user.id),
              getCulturaRegistros(session.user.id),
              getViajes(session.user.id),
              getFotos(session.user.id),
            ]);
            setProfile(profile);
            setRegistros(registros);
            setViajes(viajes);
            setFotos(fotos);
          } catch {
            setProfile(null);
          } finally {
            setLoading(false);
          }
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
