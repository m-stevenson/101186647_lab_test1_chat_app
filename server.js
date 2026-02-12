import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import messageRoutes from "./routes/messages.js";
import { GroupMessage } from "./models/GroupMessage.js";
import { PrivateMessage } from "./models/PrivateMessage.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));
app.use("/view", express.static("view"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const ROOMS = [
  "Full-Stack Development",
  "Machine Learning/AI",
  "Sports",
  "Reading",
];

function formatNow() {
  return new Date().toLocaleString();
}

const socketState = new Map();

io.on("connection", (socket) => {
  socket.on("join_room", ({ username, room }) => {
    const name = (username || "").trim();
    const rm = (room || "").trim();

    if (!name) {
      socket.emit("error_message", { error: "Name is required to join" });
      return;
    }
    if (!rm) {
      socket.emit("error_message", { error: "Room is required" });
      return;
    }
    if (!ROOMS.includes(rm)) {
      socket.emit("error_message", { error: "Invalid room" });
      return;
    }

    // leave old room if any
    const prev = socketState.get(socket.id);
    if (prev?.room) socket.leave(prev.room);

    socket.join(rm);
    socketState.set(socket.id, { username: name, room: rm });

    socket.to(rm).emit("system_message", {
      message: `${name} joined ${rm}`,
      date_sent: formatNow(),
    });

    socket.emit("joined_room", { room: rm, username: name });
  });

  // Leave room
  socket.on("leave_room", () => {
    const st = socketState.get(socket.id);
    if (!st?.room) return;

    socket.leave(st.room);
    socket.to(st.room).emit("system_message", {
      message: `${st.username} left ${st.room}`,
      date_sent: formatNow(),
    });

    socketState.set(socket.id, { username: st.username, room: null });
    socket.emit("left_room");
  });

  // Typing indicator
  socket.on("typing", ({ isTyping }) => {
    const st = socketState.get(socket.id);
    if (!st?.room) return;
    socket
      .to(st.room)
      .emit("typing", { username: st.username, isTyping: !!isTyping });
  });

  // Group message
  socket.on("group_message", async ({ message }) => {
    const st = socketState.get(socket.id);
    if (!st?.room || !st?.username) return;

    const clean = (message || "").trim();
    if (!clean) return;

    const doc = await GroupMessage.create({
      from_user: st.username,
      room: st.room,
      message: clean,
      date_sent: formatNow(),
    });

    io.to(st.room).emit("group_message", doc);
  });

  // Private message
  socket.on("private_message", async ({ to_user, message, from_user }) => {
    const st = socketState.get(socket.id);
    const sender = st?.username;
    if (!sender || sender !== from_user) return;

    const clean = (message || "").trim();
    if (!to_user || !clean) return;

    const doc = await PrivateMessage.create({
      from_user: sender,
      to_user,
      message: clean,
      date_sent: formatNow(),
    });

    socket.emit("private_message", doc);
    io.emit("private_message", doc);
  });

  socket.on("disconnect", () => {
    const st = socketState.get(socket.id);
    if (st?.room) {
      socket.to(st.room).emit("system_message", {
        message: `${st.username} disconnected`,
        date_sent: formatNow(),
      });
    }
    socketState.delete(socket.id);
  });
});

// Connect to db and listen on port 3000
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
