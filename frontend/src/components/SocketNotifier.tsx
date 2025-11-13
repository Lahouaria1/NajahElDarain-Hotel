// src/components/SocketNotifier.tsx
import { useEffect } from 'react';
import { connectSocket, getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import type { Booking } from '../lib/api';

export default function SocketNotifier() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    connectSocket(token);
    const s = getSocket();

    const say = (msg: string) => {
      console.log('[notify]', msg);
      alert(msg);
    };

    const onCreated = (b: Booking) => {
      const when = new Date(b.startTime).toLocaleString();
      const roomName =
        typeof b.roomId === 'string' ? b.roomId : b.roomId?.name ?? 'Rum';
      say(`Ny bokning: ${roomName} – ${when}`);
    };

    const onUpdated = () => {
      say('Bokning uppdaterad');
    };

    const onDeleted = ({ id }: { id: string }) => {
      say(`Bokning borttagen (${id})`);
    };

    s.on('booking:created', onCreated);
    s.on('booking:updated', onUpdated);
    s.on('booking:deleted', onDeleted);

    return () => {
      s.off('booking:created', onCreated);
      s.off('booking:updated', onUpdated);
      s.off('booking:deleted', onDeleted);
    };
  }, [token]);

  return null;
}
