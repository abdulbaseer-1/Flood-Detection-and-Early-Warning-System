const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const validate = require('../middleware/validate');
const Node = require('../models/Node');
const Telemetry = require('../models/Telemetry');

// ─── Helper: throw structured error ───────────────────────────────────────────
const createError = (msg, code = 400) => {
  const e = new Error(msg);
  e.statusCode = code;
  return e;
};

// ─── GET /api/nodes ───────────────────────────────────────────────────────────
// Returns all nodes with their latest status — used by Member 5 (GIS map)
router.get('/', async (req, res, next) => {
  try {
    const nodes = await Node.find({}).select('-__v').lean();
    res.json({ success: true, count: nodes.length, data: nodes });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/nodes/:id ───────────────────────────────────────────────────────
// Returns a single node's metadata + graph edges
router.get(
  '/:id',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  async (req, res, next) => {
    try {
      const node = await Node.findOne({ nodeId: req.params.id }).select('-__v').lean();
      if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));
      res.json({ success: true, data: node });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/nodes/:id/history ───────────────────────────────────────────────
// Returns time-series telemetry for a node — used by Member 6 (charts)
// Query params: hours (default 24), limit (default 500)
router.get(
  '/:id/history',
  [
    param('id').notEmpty().withMessage('nodeId is required'),
    query('hours')
      .optional()
      .isInt({ min: 1, max: 168 })
      .withMessage('hours must be 1–168'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 2000 })
      .withMessage('limit must be 1–2000'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const hours = parseInt(req.query.hours) || 24;
      const limit = parseInt(req.query.limit) || 500;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const records = await Telemetry.find({
        nodeId: req.params.id,
        timestamp: { $gte: since },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .select('-_id -__v -raw_payload')
        .lean();

      res.json({
        success: true,
        nodeId: req.params.id,
        hours,
        count: records.length,
        data: records,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/nodes/:id/latest ────────────────────────────────────────────────
// Returns only the most recent telemetry reading — used by Member 5 live markers
router.get(
  '/:id/latest',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  async (req, res, next) => {
    try {
      const record = await Telemetry.findOne({ nodeId: req.params.id })
        .sort({ timestamp: -1 })
        .select('-_id -__v -raw_payload')
        .lean();

      if (!record) return next(createError(`No telemetry found for '${req.params.id}'`, 404));
      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/nodes/:id/graph ─────────────────────────────────────────────────
// Returns the directed graph edges (parent → this node) — used by Member 4 algo
router.get(
  '/:id/graph',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  async (req, res, next) => {
    try {
      const node = await Node.findOne({ nodeId: req.params.id })
        .select('nodeId parentNodes')
        .lean();
      if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));
      res.json({ success: true, nodeId: node.nodeId, parentNodes: node.parentNodes });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/nodes/:id/status ───────────────────────────────────────────────
// Member 4 algo calls this to update a node's flood status + trigger WS alert
router.post(
  '/:id/status',
  [
    param('id').notEmpty().withMessage('nodeId is required'),
    query('status').optional(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, predicted_volume_m3, message } = req.body;

      const allowed = ['normal', 'warning', 'critical', 'sensor_malfunction', 'offline'];
      if (!allowed.includes(status)) {
        return next(createError(`Invalid status. Must be one of: ${allowed.join(', ')}`, 400));
      }

      const node = await Node.findOneAndUpdate(
        { nodeId: req.params.id },
        { status, lastSeen: new Date() },
        { new: true }
      ).lean();

      if (!node) return next(createError(`Node '${req.params.id}' not found`, 404));

      // Emit WebSocket alert to all connected clients
      const io = req.app.get('io');
      if (io && (status === 'warning' || status === 'critical')) {
        io.emit('flood_alert', {
          nodeId: req.params.id,
          status,
          predicted_volume_m3: predicted_volume_m3 || null,
          message: message || `Node ${req.params.id} entered ${status} state`,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ success: true, data: node });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;