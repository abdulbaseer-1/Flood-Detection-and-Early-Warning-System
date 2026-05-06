const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const nodeRoutes = require('./routes/nodes');
const errorHandler = require('./middleware/errorHandler');

const createApp = () => {
  const app = express();

  // ── Security & logging ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── CORS — allow React dashboard origin ─────────────────────────────────────
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    })
  );

  // ── Body parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AFPEWS API',
      uptime: process.uptime().toFixed(2) + 's',
      timestamp: new Date().toISOString(),
    });
  });

  // ── API Routes ───────────────────────────────────────────────────────────────
  app.use('/api/nodes', nodeRoutes);

  // ── 404 handler ──────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
  });

  // ── Global error handler (must be last) ──────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;