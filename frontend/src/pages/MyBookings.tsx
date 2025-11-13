// src/pages/MyBookings.tsx
import { useEffect, useMemo, useState } from 'react';
import { api, type Booking, type Room } from '../lib/api';
// import useLiveBookings from '../hooks/useLiveBookings';

const toLocalInputValue = (isoUtcString: string) => {
  const date = new Date(isoUtcString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const getBookingRoomId = (booking: Booking): string | undefined =>
  typeof booking.roomId === 'string' ? booking.roomId : booking.roomId?._id;

const getBookingRoomName = (booking: Booking): string =>
  typeof booking.roomId === 'string' ? 'Rum' : booking.roomId?.name ?? 'Rum';

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const currentLocalIso = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  async function loadBookingsAndRooms() {
    setIsLoading(true);
    setMessage(null);
    try {
      const [bookingsResponse, roomsResponse] = await Promise.all([
        api.getBookings(),
        api.getRooms(),
      ]);

      const sortedBookings = bookingsResponse
        .slice()
        .sort(
          (a, b) =>
            +new Date(b.startTime).getTime() - +new Date(a.startTime).getTime()
        );

      setBookings(sortedBookings);
      setRooms(roomsResponse);
    } catch (error: any) {
      setMessage(error.message || 'Kunde inte hämta bokningar');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBookingsAndRooms();
  }, []);

  // useLiveBookings(setBookings);

  const handleStartEdit = (booking: Booking) => {
    setEditingBookingId(booking._id);
    setSelectedRoomId(getBookingRoomId(booking) || '');
    setStartTime(toLocalInputValue(booking.startTime));
    setEndTime(toLocalInputValue(booking.endTime));
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setSelectedRoomId('');
    setStartTime('');
    setEndTime('');
  };

  const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingBookingId) return;

    if (!selectedRoomId || !startTime || !endTime) {
      setMessage('Fyll i alla fält');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setMessage('Sluttid måste vara efter starttid');
      return;
    }

    try {
      setIsSaving(true);
      await api.updateBooking(editingBookingId, {
        roomId: selectedRoomId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setMessage('Bokning uppdaterad');
      handleCancelEdit();
      await loadBookingsAndRooms();
    } catch (error: any) {
      setMessage(error.message || 'Kunde inte uppdatera bokning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Ta bort bokningen?')) return;
    try {
      await api.deleteBooking(bookingId);
      setMessage('Bokning borttagen');
      await loadBookingsAndRooms();
    } catch (error: any) {
      setMessage(error.message || 'Kunde inte ta bort');
    }
  };

  const roomOptions = useMemo(
    () => rooms.map((room) => ({ id: room._id, name: room.name })),
    [rooms]
  );

  if (isLoading) return <div className="container-p py-10">Laddar…</div>;

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Mina bokningar</h1>

      {message && (
        <div className="mb-4 text-sm rounded-xl px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-200">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {bookings.map((booking) => {
          const isEditing = editingBookingId === booking._id;
          return (
            <div key={booking._id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold">{getBookingRoomName(booking)}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(booking.startTime).toLocaleString()} —{' '}
                    {new Date(booking.endTime).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">ID: {booking._id}</div>
                </div>

                {!isEditing && (
                  <div className="flex gap-2">
                    <button
                      className="btn-success"
                      onClick={() => handleStartEdit(booking)}
                    >
                      Redigera
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteBooking(booking._id)}
                    >
                      Ta bort
                    </button>
                  </div>
                )}
              </div>

              {isEditing && (
                <form
                  onSubmit={handleSaveEdit}
                  className="mt-3 grid sm:grid-cols-4 gap-2"
                >
                  <select
                    className="select"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                  >
                    <option value="">Välj rum…</option>
                    {roomOptions.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    className="input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={currentLocalIso}
                  />
                  <input
                    type="datetime-local"
                    className="input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min={startTime || currentLocalIso}
                  />

                  <div className="flex gap-2">
                    <button className="btn-primary" disabled={isSaving}>
                      {isSaving ? 'Sparar…' : 'Spara'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleCancelEdit}
                    >
                      Avbryt
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}

        {bookings.length === 0 && <div>Inga bokningar än.</div>}
      </div>
    </div>
  );
}
