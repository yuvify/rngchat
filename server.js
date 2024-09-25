const fastify = require('fastify')();
const path = require('path');

let messages = [];
const cooldowns = new Map();

// Serve static files from the public directory
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/', // optional: default '/'
});

// Endpoint to get chat messages
fastify.get('/messages', async (request, reply) => {
  return { messages: messages.slice(-100) }; // Send the last 100 messages
});

// Endpoint to post a chat message
fastify.post('/messages', async (request, reply) => {
  const { username, message } = request.body;
  const now = Date.now();
  const lastMessageTime = cooldowns.get(username) || 0;

  if (message.length > 250) {
    return reply.code(400).send({ error: 'Message is too long' });
  }

  if (now - lastMessageTime < 500) {
    return reply.code(429).send({ error: 'User is sending messages too fast' });
  }

  messages.push({ username, message });
  cooldowns.set(username, now);
  
  return { success: true };
});

// Start the server
const PORT = process.env.PORT || 3000;
fastify.listen(PORT, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
