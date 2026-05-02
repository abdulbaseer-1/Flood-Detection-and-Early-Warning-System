// routes/graphRoutes.js
import mongoose from "mongoose";
import express from "express";
const router    = express.Router();
import CanalNode from "../models/nodeSchema.js";
import { getDownstreamNodes, getFullGraph, getImmediateChildren } from "../utils/graphTraversal.js";
import { validateGraph } from "../utils/graphValidator.js";

// GET /api/graph/full-graph  — all nodes + edges for Leaflet map (FRONTEND)
router.get('/full-graph', async (req, res) => {
  try {
    res.json({ success: true, data: await getFullGraph() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/graph/downstream/:nodeId  — flood path + lag times from a spiked node (ALGOROTHM)
router.get('/downstream/:nodeId', async (req, res) => {
  try {
    const sourceNode = await CanalNode.findOne({ node_id: req.params.nodeId }).lean();
    if (!sourceNode) return res.status(404).json({ success: false, error: `Node '${req.params.nodeId}' not found` });
    const downstream = await getDownstreamNodes(req.params.nodeId);
    res.json({ success: true, source: sourceNode, downstream });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/graph/children/:nodeId  — immediate next nodes only (BACKEND/MQTT)
router.get('/children/:nodeId', async (req, res) => {
  try {
    res.json({ success: true, data: await getImmediateChildren(req.params.nodeId) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/graph/nodes  — all active nodes for sidebar list
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await CanalNode.find({ is_active: true }).lean();
    res.json({ success: true, count: nodes.length, data: nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/validate', async (req, res) => {
  try {
    const result = await validateGraph();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

