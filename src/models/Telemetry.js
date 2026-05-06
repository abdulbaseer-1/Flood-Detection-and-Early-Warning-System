const mongoose = require('mongoose');

// Time-series sensor readings — one doc per sensor ping
const TelemetrySchema = new mongoose.Schema(
  {
    nodeId: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    water_level_m: { type: Number, default: null },  // metres (distance-to-water)
    flow_rate_m3s: { type: Number, default: null },  // m³/s from flow sensor
    temperature_k: { type: Number, default: null },  // Kelvin from DHT22
    rainfall_mmhr: { type: Number, default: null },  // from OpenWeatherMap
    predicted_volume_m3: { type: Number, default: null }, // from Member 4 algo
    raw_payload: { type: Object, default: {} },      // original MQTT JSON stored as-is
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'nodeId',
      granularity: 'seconds',
    },
  }
);

module.exports = mongoose.model('Telemetry', TelemetrySchema);