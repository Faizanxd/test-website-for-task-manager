const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const socketIO = require("socket.io"); // ✅ import socket.io
const { setIO } = require("./socket"); // 🔄 update from initSocket → setIO

dotenv.config();
connectDB();

const app = express();

// ✅ Set proper CORS config for both Express & Socket.IO
const allowedOrigin = "http://localhost:5173";
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Attach Socket.IO with CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
setIO(io); // ✅ store io globally (you must export setIO in socket.js)

// ✅ Socket.IO connection listener
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
