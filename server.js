require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const createApp = require('./src/app');
const connectDB = require('./src/config/db');
const { registerSocketHandlers } = require('./src/sockets/alertEmitter');

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  // 1. Connect database
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Wrap in HTTP server (required for Socket.io)
  const httpServer = http.createServer(app);

  // 4. Attach Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    // Auto-reconnect config the client should mirror
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // 5. Make io accessible inside route handlers (for POST /status emit)
  app.set('io', io);

  // 6. Register all WebSocket event handlers
  registerSocketHandlers(io);

  // 7. Start listening
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 AFPEWS API running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health\n`);
  });

  // 8. Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received — shutting down gracefully');
    httpServer.close(() => process.exit(0));
  });
};

bootstrap().catch((err) => {
  console.error('[SERVER] Bootstrap failed:', err.message);
  process.exit(1);
});