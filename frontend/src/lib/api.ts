// src/lib/api.ts
// -----------------------------------------------------------------------------
// Tiny typed API client for the frontend.
// -----------------------------------------------------------------------------

export type User = { id: string; username: string; role: 'User' | 'Admin' };

export type Room = {
  _id: string;
  name: string;
  capacity: number;
  type: 'workspace' | 'conference';
  imageUrl?: string;
  description?: string;
};

export type Booking = {
  _id: string;
  roomId: string | { _id: string; name: string; type: 'workspace' | 'conference' };
  userId: string | { _id: string; username: string };
  startTime: string; // ISO-8601 UTC
  endTime: string;   // ISO-8601 UTC
};

type LoginRes = { token: string; user: User };

// Base URL (works with VITE_API_BASE_URL or VITE_API_URL; dev fallback 4000)
const RAW_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:4000';

export const BASE = RAW_BASE.replace(/\/+$/, '').replace(/\/api$/i, '');

function token() {
  return localStorage.getItem('token') || '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const t = token();
  if (t) headers.set('Authorization', `Bearer ${t}`);

  const maxAttempts = 3;
  const baseDelayMs = 1500;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const res = await fetch(`${BASE}${path}`, { ...init, headers, signal: controller.signal });
      const text = await res.text();
      clearTimeout(timeout);

      if (!res.ok) {
        try {
          const data = text ? JSON.parse(text) : null;
          const msg = data?.error || data?.message || text || `HTTP ${res.status}`;
          throw new Error(msg);
        } catch {
          throw new Error(text || `HTTP ${res.status}`);
        }
      }

      return (text ? JSON.parse(text) : {}) as T; // handle 204
    } catch (e: any) {
      clearTimeout(timeout);
      lastErr = e;
      const isTimeout = e?.name === 'AbortError';
      const looksNetworky = e instanceof TypeError || /Network\s?Error|Failed to fetch/i.test(String(e?.message));

      if (attempt < maxAttempts && (isTimeout || looksNetworky)) {
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
        continue;
      }

      throw isTimeout ? new Error('Servern vaknar. Försök igen strax.') : e;
    }
  }

  throw lastErr as Error;
}

export const api = {
  // Auth
  register: (u: string, p: string) =>
    request<LoginRes>('/api/register', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),
  login: (u: string, p: string) =>
    request<LoginRes>('/api/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }),

  // Rooms
  getRooms: () => request<Room[]>('/api/rooms'),
  createRoom: (data: Partial<Room>) =>
    request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: string) => request<void>(`/api/rooms/${id}`, { method: 'DELETE' }),

  // Bookings
  getBookings: () => request<Booking[]>('/api/bookings'),
  createBooking: (data: { roomId: string; startTime: string; endTime: string }) =>
    request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id: string, data: Partial<{ startTime: string; endTime: string; roomId: string }>) =>
    request<Booking>(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBooking: (id: string) => request<void>(`/api/bookings/${id}`, { method: 'DELETE' }),

  // Users (Admin)
  getUsers: () =>
    request<Array<{ _id: string; username: string; role: 'User' | 'Admin' }>>('/api/users'),
  deleteUser: (id: string) =>
    request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};
