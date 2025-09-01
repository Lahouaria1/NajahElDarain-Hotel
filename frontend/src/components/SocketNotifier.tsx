// src/components/SocketNotifier.tsx
import { useEffect } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import type { Booking } from '../lib/api';

/**
 * Lightweight listener component:
 * - Subscribes to booking events over Socket.IO
 * - Shows a quick message (alert/console) when something happens
 * - Cleans up by removing ONLY its listeners (does NOT disconnect the shared socket)
 *
 * Mount once near the root (e.g., in main.tsx or App layout) so the whole app gets notifications.
 */
export default function SocketNotifier() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    // Ensure the shared socket is connected (AuthContext already does this,
    // but connectSocket is idempotent — safe to call again)
    connectSocket(token);
    const s = getSocket();

    // Replace this with your toast system (e.g., react-hot-toast)
    const say = (msg: string) => {
      console.log('[notify]', msg);
      alert(msg);
    };

    // Handlers
    const onCreated = (b: Booking) => {
      const when = new Date(b.startTime).toLocaleString();
      const roomName =
        typeof b.roomId === 'string' ? b.roomId : b.roomId?.name ?? 'Rum';
      say(`Ny bokning: ${roomName} – ${when}`);
    };

    const onUpdated = (b: Booking) => {
      say('Bokning uppdaterad');
    };

    const onDeleted = ({ id }: { id: string }) => {
      say(`Bokning borttagen (${id})`);
    };

    // Subscribe
    s.on('booking:created', onCreated);
    s.on('booking:updated', onUpdated);
    s.on('booking:deleted', onDeleted);

    // Cleanup: remove listeners only (don’t disconnect the shared socket)
    return () => {
      s.off('booking:created', onCreated);
      s.off('booking:updated', onUpdated);
      s.off('booking:deleted', onDeleted);
    };
  }, [token]);

  return null;
}
