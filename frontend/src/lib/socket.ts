// Keep one shared Socket.IO client and connect only after login.

import { io, type Socket } from 'socket.io-client';
import { BASE as API_BASE } from './api';

// Prefer explicit socket URL, else API URL, else localhost
const BASE =
  (import.meta.env.VITE_SOCKET_URL ?? API_BASE ?? 'http://localhost:4000')
    .replace(/\/+$/, '');

let socket: Socket | null = null;

/** Create/connect (optionally with JWT) */
export function connectSocket(jwt?: string): Socket {
  if (!socket) {
    socket = io(BASE, {
      transports: ['websocket'],
      withCredentials: false, // cookie-less auth
      autoConnect: true,
      auth: jwt ? { token: jwt } : undefined, // backend reads handshake.auth.token
    });

    socket.on('connect_error', (err) => {
      console.warn('socket connect_error:', err.message);
    });
    socket.on('reconnect_attempt', (n) => {
      console.log('socket reconnect_attempt:', n);
    });
  } else if (jwt) {
    // Update token and reconnect if needed
    socket.auth = { token: jwt };
    if (!socket.connected) socket.connect();
  }
  return socket;
}

/** Get existing singleton (lazy create without auth) */
export function getSocket(): Socket {
  return connectSocket();
}

/** Cleanly close on logout */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
