// src/pages/MyBookings.tsx
import { useEffect, useMemo, useState } from 'react';
import { api, type Booking, type Room } from '../lib/api';
// Optional: live updates via Socket.IO (uncomment to auto-refresh)
// import useLiveBookings from '../hooks/useLiveBookings';

/** ISO → local value for datetime-local input */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
};

/** Safely read room id whether populated or not */
const getRoomId = (b: Booking): string | undefined =>
  typeof b.roomId === 'string' ? b.roomId : b.roomId?._id;

/** Show room name if populated; fallback */
const getRoomName = (b: Booking): string =>
  typeof b.roomId === 'string' ? 'Rum' : b.roomId?.name ?? 'Rum';

export default function MyBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [saving, setSaving] = useState(false);

  /** Lower bound for inputs (now, local) */
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  /** Load my bookings + rooms for select */
  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const [bs, rs] = await Promise.all([api.getBookings(), api.getRooms()]);
      // newest first by start
      setItems(bs.slice().sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)));
      setRooms(rs);
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(err.message || 'Kunde inte hämta bokningar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Optional: enable for live auto-refresh
  // useLiveBookings(setItems);

  const startEdit = (b: Booking) => {
    setEditId(b._id);
    setRoomId(getRoomId(b) || '');
    setStart(toLocalInput(b.startTime));
    setEnd(toLocalInput(b.endTime));
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setRoomId('');
    setStart('');
    setEnd('');
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    if (!roomId || !start || !end) return setMsg('Fyll i alla fält');
    if (new Date(start) >= new Date(end)) return setMsg('Sluttid måste vara efter starttid');

    try {
      setSaving(true);
      await api.updateBooking(editId, {
        roomId,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });
      setMsg('Bokning uppdaterad');
      cancelEdit();
      await load();
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(err.message || 'Kunde inte uppdatera bokning');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Ta bort bokningen?')) return;
    try {
      await api.deleteBooking(id);
      setMsg('Bokning borttagen');
      await load();
    } catch (e: unknown) {
      const err = e as Error;
      setMsg(err.message || 'Kunde inte ta bort');
    }
  };

  const roomOpts = useMemo(() => rooms.map(r => ({ id: r._id, name: r.name })), [rooms]);

  if (loading) return <div className="container-p py-10">Laddar…</div>;

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Mina bokningar</h1>

      {msg && (
        <div className="mb-4 text-sm rounded-xl px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-200">
          {msg}
        </div>
      )}

      <div className="space-y-3">
        {items.map(b => {
          const isEditing = editId === b._id;
          return (
            <div key={b._id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-semibold">{getRoomName(b)}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">ID: {b._id}</div>
                </div>

                {!isEditing && (
                  <div className="flex gap-2">
                    <button className="btn-success" onClick={() => startEdit(b)}>Redigera</button>
                    <button className="btn-danger" onClick={() => remove(b._id)}>Ta bort</button>
                  </div>
                )}
              </div>

              {isEditing && (
                <form onSubmit={save} className="mt-3 grid sm:grid-cols-4 gap-2">
                  <select
                    className="select"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  >
                    <option value="">Välj rum…</option>
                    {roomOpts.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>

                  <input
                    type="datetime-local"
                    className="input"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    min={nowLocal}
                  />
                  <input
                    type="datetime-local"
                    className="input"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    min={start || nowLocal}
                  />

                  <div className="flex gap-2">
                    <button className="btn-primary" disabled={saving}>
                      {saving ? 'Sparar…' : 'Spara'}
                    </button>
                    <button type="button" className="btn-ghost" onClick={cancelEdit}>
                      Avbryt
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        })}

        {items.length === 0 && <div>Inga bokningar än.</div>}
      </div>
    </div>
  );
}
