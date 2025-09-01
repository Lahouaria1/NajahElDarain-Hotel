// src/lib/api.ts
// -----------------------------------------------------------------------------
// Tiny typed API client for the frontend.
// - Centralizes base URL, auth header, error handling, and JSON parsing.
// - Exposes strongly-typed helpers for auth, rooms, bookings and users.
// -----------------------------------------------------------------------------

// --------- Shared types returned by the backend --------------------------------
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

  // roomId can be an id (string) OR a populated object (from backend .populate)
  roomId: string | { _id: string; name: string; type: 'workspace' | 'conference' };

  // userId can be an id (string) OR a populated object
  userId: string | { _id: string; username: string };

  startTime: string; // ISO-8601 in UTC (e.g., "2025-08-31T12:00:00.000Z")
  endTime: string;   // ISO-8601 in UTC
};

type LoginRes = { token: string; user: User };

// Resolve API base from Vite env, fallback to local backend
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Read JWT from localStorage (set by AuthContext after login/register)
function token() {
  return localStorage.getItem('token') || '';
}

/**
 * request<T>
 * -----------
 * Generic fetch wrapper:
 *  - Sets JSON headers and Authorization: Bearer <token> when present
 *  - Reads body once as text, to allow consistent error parsing
 *  - On non-OK: throws Error(message) where message prefers `{error}`/`{message}` from server
 *  - On OK: returns parsed JSON (or {} for 204 / empty body)
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');

  const t = token();
  if (t) headers.set('Authorization', `Bearer ${t}`);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Read once as text so we can parse for both error/success
  const text = await res.text();

  if (!res.ok) {
    // Try to surface structured errors from backend: { error: "..."} or { message: "..." }
    try {
      const data = text ? JSON.parse(text) : null;
      const msg = data?.error || data?.message || text || `HTTP ${res.status}`;
      throw new Error(msg);
    } catch {
      // Non-JSON error body—return raw text or fallback to status
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  // 204 No Content or empty body
  if (!text) return {} as T;

  // Success JSON
  return JSON.parse(text) as T;
}

// ---------------------- API surface (used by pages/components) -----------------
export const api = {
  // ---- Auth ----
  register: (u: string, p: string) =>
    request<LoginRes>('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p }),
    }),

  login: (u: string, p: string) =>
    request<LoginRes>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: u, password: p }),
    }),

  // ---- Rooms (Admin can create/update/delete; all auth users can list) ----
  getRooms: () => request<Room[]>('/api/rooms'),

  createRoom: (data: Partial<Room>) =>
    request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),

  updateRoom: (id: string, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteRoom: (id: string) =>
    request<void>(`/api/rooms/${id}`, { method: 'DELETE' }),

  // ---- Bookings (User sees own; Admin sees all) ----
  getBookings: () => request<Booking[]>('/api/bookings'),

  createBooking: (data: { roomId: string; startTime: string; endTime: string }) =>
    request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),

  updateBooking: (
    id: string,
    data: Partial<{ startTime: string; endTime: string; roomId: string }>
  ) =>
    request<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBooking: (id: string) =>
    request<void>(`/api/bookings/${id}`, { method: 'DELETE' }),

  // ---- Users (Admin only) ----
  getUsers: () =>
    request<Array<{ _id: string; username: string; role: 'User' | 'Admin' }>>(
      '/api/users'
    ),

  deleteUser: (id: string) =>
    request<void>(`/api/users/${id}`, { method: 'DELETE' }),
};
