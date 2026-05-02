//(connections)

// models/edgeSchema.js
// One document = one directed connection between two canal nodes.
// Always flows from higher elevation → lower (enforced by pre-save hook).
// Written once at setup. Not updated by sensor readings.

import mongoose from "mongoose";

const canalEdgeSchema = new mongoose.Schema({

  // Direction: water flows FROM → TO (always higher → lower elevation)
  from_node_id: {
    type:     String,
    required: true,
    ref:      'CanalNode',
  },

  to_node_id: {
    type:     String,
    required: true,
    ref:      'CanalNode',
  },

  // ── Physical canal geometry between the two nodes ─────────────────────────
  distance_m: {
    type:     Number,
    required: true,    // metres — physical length of canal segment
  },

  elevation_drop_m: {
    type:     Number,
    required: true,    // metres — from_node.elevation_m − to_node.elevation_m
    min:      0.01,    // must be positive (enforced separately in pre-save)
  },

  // ── Flow velocity and lag time ────────────────────────────────────────────
  // flow_velocity_mps: how fast water travels through this segment.
  // Estimated from elevation_drop_m / distance_m (Manning's approximation).
  // Will be refined over time as real sensor data comes in.
  flow_velocity_mps: {
    type:    Number,
    default: 0.5,      // m/s — conservative default for Mardan canals
    min:     0.01,
  },

  // lag_time_minutes: how long for a water spike at from_node to reach to_node.
  // Auto-calculated on every save: (distance_m / flow_velocity_mps) / 60
  // This is the "lag_factor" in your spec's flood prediction formula.
  lag_time_minutes: {
    type: Number,      // auto-populated by pre-save hook — do not set manually
  },

}, { timestamps: true });


// ── Pre-save hook: validation + auto-calculation ──────────────────────────────
canalEdgeSchema.pre('save', async function(next) {

  // Guard 1: no self-loops
  if (this.from_node_id === this.to_node_id) {
    return next(new Error(`Self-loop rejected: edge cannot point to itself (${this.from_node_id})`));
  }

  // Guard 2: elevation must decrease (higher → lower only)
  // This is the structural guarantee that prevents infinite loops in BFS.
  const CanalNode = mongoose.model('CanalNode');
  const [fromNode, toNode] = await Promise.all([
    CanalNode.findOne({ node_id: this.from_node_id }),
    CanalNode.findOne({ node_id: this.to_node_id   }),
  ]);

  if (fromNode && toNode) {
    if (fromNode.elevation_m <= toNode.elevation_m) {
      return next(new Error(
        `Elevation error: ${this.from_node_id} (${fromNode.elevation_m}m) must be ` +
        `higher than ${this.to_node_id} (${toNode.elevation_m}m)`
      ));
    }
  }

  // Auto-calculate lag time every save (recalculates if velocity is updated)
  this.lag_time_minutes = parseFloat(
    ((this.distance_m / this.flow_velocity_mps) / 60).toFixed(2)
  );

  next();
});


// ── Indexes ───────────────────────────────────────────────────────────────────
// BFS traversal queries "find all children of node X" on every flood event.
// These indexes make those queries O(log n) instead of O(n).
canalEdgeSchema.index({ from_node_id: 1 });   // "get all outgoing edges from X"
canalEdgeSchema.index({ to_node_id:   1 });   // "get all incoming edges to X"

export default mongoose.model('CanalEdge', canalEdgeSchema);
