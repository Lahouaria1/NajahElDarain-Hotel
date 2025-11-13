// frontend/src/hooks/useLiveBookings.ts
import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { getSocket } from '../lib/socket';
import type { Booking } from '../lib/api';

export default function useLiveBookings(
  setList: Dispatch<SetStateAction<Booking[]>>
) {
  useEffect(() => {
    const socket = getSocket();

    const upsert = (booking: Booking) => {
      setList(currentList => {
        const index = currentList.findIndex(
          bookingItem => bookingItem._id === booking._id
        );
        if (index === -1) return [booking, ...currentList];
        const updatedList = currentList.slice();
        updatedList[index] = booking;
        return updatedList;
      });
    };

    const remove = ({ id }: { id: string }) => {
      setList(currentList =>
        currentList.filter(bookingItem => bookingItem._id !== id)
      );
    };

    socket.on('booking:created', upsert);
    socket.on('booking:updated', upsert);
    socket.on('booking:deleted', remove);

    return () => {
      socket.off('booking:created', upsert);
      socket.off('booking:updated', upsert);
      socket.off('booking:deleted', remove);
    };
  }, [setList]);
}
