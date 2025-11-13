// src/lib/socket.ts
import { io, type Socket } from 'socket.io-client';
import { BASE as API_BASE } from './api';

const BASE = (import.meta.env.VITE_SOCKET_URL ?? API_BASE ?? 'http://localhost:4000').replace(/\/+$/, '');

let socket: Socket | null = null;

export function connectSocket(jwt?: string): Socket {
  if (!socket) {
    socket = io(BASE, {
      transports: ['polling', 'websocket'],
      path: '/socket.io',
      withCredentials: false,
      autoConnect: true,
      auth: jwt ? { token: jwt } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    console.log('[SOCKET] base =', BASE);

    socket.on('connect', () => console.log('[SOCKET] connected', socket!.id));
    socket.on('connect_error', (err) => console.warn('[SOCKET] connect_error:', err?.message || err));
    socket.on('reconnect_attempt', (n) => console.log('[SOCKET] reconnect_attempt', n));
  } else if (jwt) {
    socket.auth = { token: jwt };
    if (!socket.connected) socket.connect();
  }
  return socket;
}

export function getSocket(): Socket {
  return connectSocket();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
