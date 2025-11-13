// src/pages/Rooms.tsx
import { useEffect, useState } from 'react';
import { api, type Room, type Booking } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type FormState = { roomId?: string; start?: string; end?: string };

export default function Rooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Block past times
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.getRooms(),
        api.getBookings(),
      ]);
      setRooms(roomsRes);
      setBookings(bookingsRes);
    } catch (err: any) {
      setMsg(err.message || 'Kunde inte hämta rum');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roomId || !form.start || !form.end) {
      setMsg('Fyll i alla fält');
      return;
    }
    if (new Date(form.start) >= new Date(form.end)) {
      setMsg('Sluttid måste vara efter starttid');
      return;
    }
    try {
      await api.createBooking({
        roomId: form.roomId,
        startTime: new Date(form.start).toISOString(),
        endTime: new Date(form.end).toISOString(),
      });
      setMsg('Bokning skapad');
      setForm({});
      await load();
    } catch (err: any) {
      setMsg(err.message || 'Kunde inte skapa bokning');
    }
  }

  if (!user) return <div className="container-p py-10">Logga in för att se rum.</div>;
  if (loading) return <div className="container-p py-10">Laddar…</div>;

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Rum</h1>

      {msg && (
        <div className="mb-4 text-sm rounded-xl px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-200">
          {msg}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => {
          const upcoming = bookings
            .filter((b) =>
              typeof b.roomId === 'string'
                ? b.roomId === room._id
                : b.roomId?._id === room._id
            )
            .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
            .slice(0, 3);

          const isActive = form.roomId === room._id;
          const canBook =
            isActive &&
            !!form.start &&
            !!form.end &&
            new Date(form.start) < new Date(form.end);

          return (
            <article key={room._id} className="card overflow-hidden">
              <img
                src={room.imageUrl || 'https://picsum.photos/640/360'}
                alt={room.name}
                className="h-44 w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{room.name}</h3>
                  <span className="text-xs uppercase border rounded-full px-2 py-0.5">
                    {room.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Kapacitet: {room.capacity}</p>

                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  {upcoming.map((b) => (
                    <li key={b._id}>
                      {new Date(b.startTime).toLocaleString()} –{' '}
                      {new Date(b.endTime).toLocaleString()}
                    </li>
                  ))}
                  {upcoming.length === 0 && (
                    <li className="opacity-60">Inga kommande tider</li>
                  )}
                </ul>

                <form onSubmit={book} className="mt-3 space-y-2">
                  <input
                    type="datetime-local"
                    className="input w-full"
                    value={isActive ? form.start || '' : ''}
                    onChange={(e) =>
                      setForm({ roomId: room._id, start: e.target.value, end: form.end })
                    }
                    min={nowLocal}
                  />
                  <input
                    type="datetime-local"
                    className="input w-full"
                    value={isActive ? form.end || '' : ''}
                    onChange={(e) =>
                      setForm({ roomId: room._id, start: form.start, end: e.target.value })
                    }
                    min={isActive ? form.start || nowLocal : nowLocal}
                  />
                  <button className="btn-primary w-full" disabled={!canBook}>
                    Boka
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
