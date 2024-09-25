const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = [];
const cooldowns = new Map();

app.use(express.static("public"));

wss.on("connection", (ws) => {
  // Send the last 100 messages to the newly connected client
  ws.send(JSON.stringify({ type: "init", messages: messages.slice(-100) }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const now = Date.now();
    const lastMessageTime = cooldowns.get(data.username) || 0;

    if (data.message.length > 250) {
      console.log("Message is too long");
      return;
    }

    if (now - lastMessageTime < 500) {
      console.log("User is sending messages too fast");
      return;
    }

    messages.push(data);
    cooldowns.set(data.username, now);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "chat message", data }));
      }
    });
  });

  ws.on("close", () => {
    cooldowns.delete(ws.username); // Clean up cooldown on disconnect
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
