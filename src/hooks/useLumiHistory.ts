import { useEffect, useState } from 'react';
import { getMensajesRecientes } from '@/services/lumi_mensajes_service';
import { useLumiStore } from '@/store/useLumiStore';

export function useLumiHistory(userId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const setMessages = useLumiStore((state) => state.setMessages);

  useEffect(() => {
    if (!userId) return;

    let active = true;

    const loadHistory = async () => {
      setIsLoading(true);

      try {
        const mensajes = await getMensajesRecientes(userId);
        if (!active) return;

        setMessages(mensajes);
      } catch (error) {
        console.error('Error cargando historial de Lumi:', error);
        setMessages([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [userId, setMessages]);

  return { isLoading };
}
