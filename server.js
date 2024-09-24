const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let messages = [];
const cooldowns = new Map();

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.emit("init", messages.slice(-100));

  socket.on("chat message", (data) => {
    const now = Date.now();
    const lastMessageTime = cooldowns.get(socket.id) || 0;

    if (data.message.length > 250) {
      console.log("Message is too long");
      return;
    }

    if (now - lastMessageTime < 500) {
      console.log("User is sending messages too fast");
      return;
    }

    messages.push(data);
    cooldowns.set(socket.id, now);

    io.emit("chat message", data);
  });

  socket.on("disconnect", () => {
    cooldowns.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
