const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const jwt = require('jsonwebtoken');
const config = require('./config');
const SubscriptionManager = require('./managers/SubscriptionManager');
const RabbitMQService = require('./services/RabbitMQService');
const onMessageHandler = require('./handlers/onMessageHandler');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { token } = url.parse(request.url, true).query;

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  jwt.verify(token, config.supabaseJwtSecret, (err, decoded) => {
    if (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      // A Supabase token payload has a `sub` field which is the user's UUID
      ws.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('error', (err) => {
  console.error('[WS] server error', err.message);
});

// Minimal HTTP endpoints for health and readiness
server.on('request', (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  if (req.method === 'GET' && req.url === '/readyz') {
    const ready = RabbitMQService.isReady();
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'text/plain' });
    res.end(ready ? 'ready' : 'not-ready');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not-found');
});

wss.on('connection', (ws, request) => {
  console.log(`Client connected: User ID ${ws.user.id}`);

  // Heartbeat mechanism to detect dead connections
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (message) => onMessageHandler(ws, message));
  ws.on('close', () => SubscriptionManager.cleanup(ws));
});

// Heartbeat interval
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

const onRabbitMQMessage = (msg) => {
  if (!msg) return;
  const routingKey = msg.fields.routingKey;
  const content = JSON.parse(msg.content.toString());

  console.log(`[RabbitMQ] Message on topic ${routingKey}`);

  const subscribers = SubscriptionManager.getSubscribersForChannel(routingKey);
  subscribers.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(content));
    }
  });
};

server.listen(config.port, () => {
  console.log(`WebSocket server running on port ${config.port}`);
  RabbitMQService.connect(onRabbitMQMessage);
});
