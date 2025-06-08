const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Maps room → { socketId: username }
const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    // Create room map if needed, then store user
    if (!rooms.has(room)) rooms.set(room, new Map());
    const users = rooms.get(room);
    users.set(socket.id, username);
    socket.join(room);

    // Welcome current user
    socket.emit("system", `Welcome to ${room} room, ${username}! ✨`);

    // Notify others & update list
    socket.to(room).emit("system", `${username} joined the room.`);
    io.to(room).emit("users", Array.from(users.values()));
  });

  socket.on("chat", ({ room, message }) => {
    const username = rooms.get(room)?.get(socket.id) || "Anonymous";
    io.to(room).emit("chat", {
      username,
      message,
      time: new Date().toLocaleTimeString(),
    });
  });

  socket.on("typing", ({ room, typing }) => {
    const username = rooms.get(room)?.get(socket.id);
    if (username) socket.to(room).emit("typing", { username, typing });
  });

  socket.on("disconnecting", () => {
    // A socket can be in multiple rooms; iterate
    socket.rooms.forEach((room) => {
      if (rooms.has(room)) {
        const users = rooms.get(room);
        const username = users.get(socket.id);
        users.delete(socket.id);
        socket.to(room).emit("system", `${username} left the room.`);
        io.to(room).emit("users", Array.from(users.values()));
        if (users.size === 0) rooms.delete(room); // tidy
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`⚡ Server listening on http://localhost:${PORT}`),
);
