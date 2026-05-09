const mongoose = require('mongoose');

// Represents a physical canal/sensor node in the directed graph
const NodeSchema = new mongoose.Schema(
  {
    // ─── STATIC DATA (Mapped via Hex ID / Physical Constraints) ─────────────
    nodeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: { type: String, required: true },          // e.g. "Mardan North Canal A"
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    elevation_m: { type: Number, required: true },     // elevation
    catchment_area_m2: { type: Number, default: 0 },   // catchmentArea
    runoff_coefficient: { type: Number, default: 0.7, min: 0, max: 1 }, // runoffCoefficient
    canal_depth_m: { type: Number, required: true },   // canalDepth
    bankfull_capacity_m3: { type: Number, required: true }, // maxCapacity

    // ─── DYNAMIC DATA (Telemetry Snapshot) ──────────────────────────────────
    // These fields are updated in real-time as sensor data arrives
    calibratedWaterHeight: { type: Number, default: 0 },
    flowRate: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    // the data for rainall is taken from weather api
    rainfall: { type: Number, default: 0 },

    // prediction fields are updated after processing the graph traversal and engine logic
    upstreamContribution:  { type: Number, default: 0 },
    
    // ─── TOPOLOGY & METADATA ────────────────────────────────────────────────
    topology_type: {
      type: String,
      enum: ['urban', 'agricultural', 'forest', 'mixed'],
      default: 'mixed',
    },
    // Directed graph edges — parent nodes that flow INTO this node
    parentNodes: [
      {
        nodeId: { type: String },
        distance_m: { type: Number },   // physical distance metres
        elevation_diff_m: { type: Number },
      },
    ],
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical', 'flooding', 'sensor_malfunction', 'offline'],
      default: 'normal',
    },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexing for spatial queries (GIS map functionality)
NodeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Node', NodeSchema);