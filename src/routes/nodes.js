const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const validate = require('../middleware/validate');

const nodesController = require('../controllers/nodesController');


// ─── GET /api/nodes ───────────────────────────────────────────────────────────
// Returns all nodes with their latest status — used by Member 5 (GIS map)
router.get('/', nodesController.getAllNodes);

// ─── GET /api/nodes/:id ───────────────────────────────────────────────────────
// Returns a single node's metadata + graph edges
router.get(
  '/:id',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  nodesController.getNodeById
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
  nodesController.getNodeHistory
);

// ─── GET /api/nodes/:id/latest ────────────────────────────────────────────────
// Returns only the most recent telemetry reading — used by Member 5 live markers
router.get(
  '/:id/latest',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  nodesController.getNodeLatest
);

// ─── GET /api/nodes/:id/graph ─────────────────────────────────────────────────
// Returns the directed graph edges (parent → this node) — used by Member 4 algo
router.get(
  '/:id/graph',
  [param('id').notEmpty().withMessage('nodeId is required')],
  validate,
  nodesController.getNodeGraph
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
  nodesController.updateNodeStatus
);

module.exports = router;