// backend/src/sockets/io.js
// Single shared Socket.IO server instance for the whole app.
// - server.js calls setIO(io) once after creating the io server
// - controllers/services call getIO() to emit events (booking:created, etc.)

let io = null;

/**
 * Store the Socket.IO server instance (called once from server.js).
 * @param {import('socket.io').Server} instance
 */
export function setIO(instance) {
  io = instance;
}

/**
 * Retrieve the shared Socket.IO server instance.
 * May be null if sockets weren’t initialized; use optional chaining:
 *   getIO()?.to('admins').emit('booking:created', payload)
 * @returns {import('socket.io').Server | null}
 */
export function getIO() {
  return io;
}
