// backend/src/sockets/io.js
let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  return io;
}
