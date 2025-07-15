const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const socketIO = require("socket.io");
const { setIO } = require("./socket");

dotenv.config();
connectDB();

const app = express();

// ✅ Read allowed frontend origin(s) from env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5173",
];

// ✅ CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl/Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Attach socket.io to the HTTP server
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
setIO(io);

// ✅ Socket events
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
