// src/pages/AdminBookings.tsx
import { useEffect, useMemo, useState } from 'react';
import { api, type Booking } from '../lib/api';
import { useSearchParams } from 'react-router-dom';
// Optional: live socket updates for admin list as well
// import useLiveBookings from '../hooks/useLiveBookings';

/** ISO → local value for datetime-local input */
function isoToLocalInput(s: string) {
  const d = new Date(s);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminBookings() {
  // All bookings (admin sees everything from the API)
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // Simple query-param filter by userId
  const [params, setParams] = useSearchParams();
  const filterUser = params.get('userId') || '';

  /** Load all bookings (admin scope) */
  async function load() {
    setLoading(true);
    try {
      const all = await api.getBookings(); // admin gets ALL from backend
      setItems(all);
    } catch (e: any) {
      setMsg(e.message || 'Kunde inte hämta bokningar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Optional: live updates via Socket.IO
  // useLiveBookings(setItems);

  /** Filter by userId if present in query string */
  const filtered = useMemo(() => {
    if (!filterUser) return items;
    return items.filter(b =>
      typeof b.userId === 'string' ? b.userId === filterUser : b.userId?._id === filterUser
    );
  }, [items, filterUser]);

  /** Open edit form */
  const onEdit = (b: Booking) => {
    setEditId(b._id);
    setStart(isoToLocalInput(b.startTime));
    setEnd(isoToLocalInput(b.endTime));
  };

  /** Save edit */
  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.updateBooking(editId, {
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
      });
      setMsg('Bokning uppdaterad');
      setEditId(null);
      load(); // refresh
    } catch (e: any) {
      setMsg(e.message || 'Kunde inte uppdatera');
    }
  };

  /** Delete booking (admin can delete any) */
  const onDelete = async (id: string) => {
    if (!confirm('Ta bort bokningen?')) return;
    try {
      await api.deleteBooking(id);
      setMsg('Bokning borttagen');
      load(); // refresh
    } catch (e: any) {
      setMsg(e.message || 'Kunde inte ta bort');
    }
  };

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Admin · Alla bokningar</h1>

      {/* Simple text filter by userId */}
      <div className="mb-4 flex items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Filter: userId (valfritt)"
          value={filterUser}
          onChange={e => setParams(e.target.value ? { userId: e.target.value } : {})}
        />
        {filterUser && <button className="btn-ghost" onClick={() => setParams({})}>Rensa filter</button>}
      </div>

      {msg && <div className="mb-4 text-sm">{msg}</div>}

      {loading ? 'Laddar…' : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b._id} className="card p-4">
              <div className="flex justify-between items-center gap-4">
                <div className="text-sm">
                  <div className="font-semibold">
                    {/* Room name (or ID if not populated) */}
                    {(typeof b.roomId === 'string' ? b.roomId : b.roomId?.name) || 'Rum'}
                    {' · '}
                    {/* Username (or ID if not populated) */}
                    {(typeof b.userId === 'string' ? b.userId : b.userId?.username) || 'Användare'}
                  </div>
                  <div>
                    {new Date(b.startTime).toLocaleString()} – {new Date(b.endTime).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">ID: {b._id}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* ✅ Green edit */}
                  <button className="btn-success" onClick={() => onEdit(b)}>Redigera</button>
                  {/* 🔴 Red delete */}
                  <button className="btn-danger" onClick={() => onDelete(b._id)}>Ta bort</button>
                </div>
              </div>

              {/* Inline edit panel */}
              {editId === b._id && (
                <form onSubmit={onSave} className="mt-3 grid sm:grid-cols-3 gap-2">
                  <input
                    type="datetime-local"
                    className="input"
                    value={start}
                    onChange={e=>setStart(e.target.value)}
                  />
                  <input
                    type="datetime-local"
                    className="input"
                    value={end}
                    onChange={e=>setEnd(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button className="btn-primary">Spara</button>
                    <button type="button" className="btn-ghost" onClick={()=>setEditId(null)}>Avbryt</button>
                  </div>
                </form>
              )}
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && <div>Inga bokningar hittades.</div>}
        </div>
      )}
    </div>
  );
}
