// Admin can create/update/delete rooms. Adds simple validation and saving guard.

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Room = {
  _id?: string;
  name: string;
  capacity: number;
  type: 'workspace' | 'conference';
  imageUrl?: string;
  description?: string;
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<Room>({
    name: '',
    capacity: 1,
    type: 'conference',
    imageUrl: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // prevent double submit
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setRooms(await api.getRooms()); }
    catch (e: any) { setMsg(e.message || 'Fel'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // Simple validation
    const cap = Number(form.capacity);
    if (!form.name.trim() || !Number.isFinite(cap) || cap < 1) {
      setMsg('Fyll i giltigt namn & kapacitet (>=1)');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await api.updateRoom(editingId, { ...form, capacity: cap });
        setMsg('Rum uppdaterat');
      } else {
        await api.createRoom({ ...form, capacity: cap });
        setMsg('Rum skapat');
      }
      setForm({ name: '', capacity: 1, type: 'conference', imageUrl: '', description: '' });
      setEditingId(null);
      load();
    } catch (e: any) {
      if (String(e.message).toLowerCase().includes('duplicate')) {
        setMsg('Redan finns rum med samma namn & typ');
      } else {
        setMsg(e.message || 'Kunde inte spara');
      }
    } finally {
      setSaving(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Ta bort rummet?')) return;
    try { await api.deleteRoom(id); setMsg('Rummet borttaget'); load(); }
    catch (e: any) { setMsg(e.message || 'Kunde inte ta bort'); }
  }

  const edit = (r: Room) => {
    setEditingId(r._id!);
    setForm({
      name: r.name,
      capacity: r.capacity,
      type: r.type,
      imageUrl: r.imageUrl,
      description: r.description
    });
  };

  return (
    <div className="container-p py-10">
      <h1 className="text-2xl font-bold mb-6">Admin · Hantera rum</h1>
      {msg && <div className="mb-4 text-sm">{msg}</div>}

      <form onSubmit={save} className="card p-4 space-y-2 max-w-2xl mb-8">
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            className="border p-2 rounded-xl"
            placeholder="Namn"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="border p-2 rounded-xl"
            type="number"
            min={1}
            placeholder="Kapacitet"
            value={form.capacity}
            onChange={(e) => {
              // Keep >= 1, allow empty while typing
              const v = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
              setForm({ ...form, capacity: v as any });
            }}
          />
          <select
            className="border p-2 rounded-xl"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as any })}
          >
            <option value="conference">conference</option>
            <option value="workspace">workspace</option>
          </select>
          <input
            className="border p-2 rounded-xl"
            placeholder="Bild-URL"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
        <textarea
          className="border p-2 rounded-xl w-full"
          placeholder="Beskrivning"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex gap-2">
          <button className="btn-primary" disabled={saving}>
            {editingId ? 'Uppdatera' : 'Skapa'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', capacity: 1, type: 'conference', imageUrl: '', description: '' });
              }}
            >
              Avbryt
            </button>
          )}
        </div>
      </form>

      {loading ? 'Laddar…' : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(r => (
            <article key={r._id} className="card overflow-hidden">
              <img
                src={r.imageUrl || 'https://picsum.photos/640/360'}
                alt={r.name}            // better a11y
                loading="lazy"          // perf
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className="text-xs uppercase border rounded-full px-2 py-0.5">{r.type}</span>
                </div>
                <p className="text-sm text-gray-600">Kapacitet: {r.capacity}</p>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost" onClick={() => edit(r)}>Redigera</button>
                  <button className="btn-ghost" onClick={() => del(r._id!)}>Ta bort</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
