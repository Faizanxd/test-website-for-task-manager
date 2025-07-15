// backend/socket.js

let ioInstance = null;

// ✅ Store the socket instance
function setIO(io) {
  ioInstance = io;
}

// ✅ Retrieve the socket instance anywhere (e.g., controller)
function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

// ✅ Export both functions
module.exports = {
  setIO,
  getIO,
};
