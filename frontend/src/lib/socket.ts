// src/lib/socket.ts
import { io, type Socket } from 'socket.io-client';

// Prefer an explicit socket URL, then fall back to API URL, then localhost.
// This matches my backend CORS config.
const BASE =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:4000';

// Singleton client (avoid multiple parallel connections)
let socket: Socket | null = null;

/**
 * Connect the socket (optionally authenticated).
 * Call this right after login/register when you have a JWT.
 */
export function connectSocket(token?: string): Socket {
  if (socket) return socket;

  socket = io(BASE, {
    transports: ['websocket'],     // use WS directly; fewer CORS/long-poll issues
    withCredentials: true,         // matches server's `credentials: true`
    autoConnect: true,             // connect immediately when created
    auth: token ? { token } : undefined, // backend reads handshake.auth.token
  });

  // Basic diagnostics (replace with your toast logger if you want)
  socket.on('connect_error', (err) => {
    console.warn('socket connect_error:', err.message);
  });
  socket.on('reconnect_attempt', (n) => {
    console.log('socket reconnect_attempt:', n);
  });

  return socket;
}

/**
 * Get the socket instance (lazy, non-authenticated).
 * Useful on pages that only need to listen, even before login.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}

/** Cleanly close and drop the singleton (call on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
