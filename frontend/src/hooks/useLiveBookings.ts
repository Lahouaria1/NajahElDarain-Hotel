// frontend/src/hooks/useLiveBookings.ts
/**
 * useLiveBookings
 * ----------------
 * Small React hook that keeps a bookings list in sync with real-time
 * Socket.IO events sent by the backend.
 *
 * Listens for:
 *  - 'booking:created'  → insert or replace the booking in the list
 *  - 'booking:updated'  → replace the booking in the list
 *  - 'booking:deleted'  → remove the booking by id
 *
 * How to use:
 *   const [items, setItems] = useState<Booking[]>([])
 *   useLiveBookings(setItems)
 *
 * Notes:
 *  - This hook does NOT fetch initial data; your page should call the REST
 *    API first (e.g., await api.getBookings()) and then this hook will keep
 *    the list fresh as changes happen.
 *  - `getSocket()` returns the singleton Socket.IO client. AuthContext
 *    connects it after login with the JWT so server-side rooms can be joined.
 */

import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { getSocket } from '../lib/socket';
import type { Booking } from '../lib/api';

export default function useLiveBookings(
  setList: Dispatch<SetStateAction<Booking[]>>
) {
  useEffect(() => {
    // Get (or lazy-create) the socket client instance
    const s = getSocket();

    /** Insert new booking at the top, or update existing entry in-place */
    const upsert = (b: Booking) => {
      setList(cur => {
        const i = cur.findIndex(x => x._id === b._id);
        if (i === -1) return [b, ...cur];    // new → prepend
        const copy = cur.slice();             // existing → replace
        copy[i] = b;
        return copy;
      });
    };

    /** Remove booking by id */
    const remove = ({ id }: { id: string }) => {
      setList(cur => cur.filter(x => x._id !== id));
    };

    // Subscribe to Socket.IO events
    s.on('booking:created', upsert);
    s.on('booking:updated', upsert);
    s.on('booking:deleted', remove);

    // Cleanup: unsubscribe on unmount
    return () => {
      s.off('booking:created', upsert);
      s.off('booking:updated', upsert);
      s.off('booking:deleted', remove);
    };
  }, [setList]);
}
