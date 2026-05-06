const mongoose = require('mongoose');

// Represents a physical canal/sensor node in the directed graph
const NodeSchema = new mongoose.Schema(
  {
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
    elevation_m: { type: Number, required: true },     // metres above sea level
    bankfull_capacity_m3: { type: Number, required: true }, // max canal capacity
    catchment_area_m2: { type: Number, default: 0 },
    runoff_coefficient: { type: Number, default: 0.7, min: 0, max: 1 },
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
      enum: ['normal', 'warning', 'critical', 'sensor_malfunction', 'offline'],
      default: 'normal',
    },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true }
);

NodeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Node', NodeSchema);