// Handles all Socket.io server-side logic
// Called from server.js after io is created

const Telemetry = require('../models/Telemetry');
const Node = require('../models/Node');

const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    console.log(`[WS] Client connected: ${socket.id} (${clientIp})`);

    // ── Client subscribes to a specific node ──────────────────────────────────
    socket.on('subscribe_node', (nodeId) => {
      if (!nodeId || typeof nodeId !== 'string') return;
      socket.join(`node:${nodeId}`);
      console.log(`[WS] ${socket.id} subscribed to node:${nodeId}`);
      socket.emit('subscribed', { nodeId, message: `Subscribed to node ${nodeId}` });
    });

    socket.on('unsubscribe_node', (nodeId) => {
      socket.leave(`node:${nodeId}`);
      console.log(`[WS] ${socket.id} unsubscribed from node:${nodeId}`);
    });

    // ── Client requests a system-wide status snapshot ─────────────────────────
    socket.on('get_all_status', async () => {
      try {
        const nodes = await Node.find({}).select('nodeId status lastSeen').lean();
        socket.emit('all_status', { timestamp: new Date().toISOString(), nodes });
      } catch (err) {
        socket.emit('error_event', { message: 'Failed to fetch status snapshot' });
      }
    });

    // ── Client requests last 10 readings for a specific node ──────────────────
    socket.on('get_latest_telemetry', async ({ nodeId, limit = 10 }) => {
      try {
        if (!nodeId) return socket.emit('error_event', { message: 'nodeId required' });
        const records = await Telemetry.find({ nodeId })
          .sort({ timestamp: -1 })
          .limit(Math.min(limit, 50))
          .select('-_id -__v -raw_payload')
          .lean();
        socket.emit('telemetry_snapshot', { nodeId, data: records });
      } catch (err) {
        socket.emit('error_event', { message: 'Failed to fetch telemetry' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id} — reason: ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`[WS] Socket error (${socket.id}):`, err.message);
    });
  });
};

// Called by Member 2's ingestion service when new sensor data arrives
// Emits live telemetry to all clients subscribed to that node
const emitTelemetry = (io, nodeId, payload) => {
  io.to(`node:${nodeId}`).emit('live_telemetry', {
    nodeId,
    ...payload,
    emittedAt: new Date().toISOString(),
  });
};

// Called by Member 4 when flood prediction crosses threshold
const emitFloodAlert = (io, nodeId, alertPayload) => {
  io.emit('flood_alert', {
    nodeId,
    ...alertPayload,
    emittedAt: new Date().toISOString(),
  });
};

module.exports = { registerSocketHandlers, emitTelemetry, emitFloodAlert };