//(canal locations)

// models/nodeSchema.js
// Represents one physical sensor mote location on the canal network.
// All fields here are STATIC — set once when the node is deployed.
// Dynamic sensor readings live in readingSchema.js.

import mongoose from "mongoose";

const canalNodeSchema = new mongoose.Schema({

  node_id: {
    type:     String,
    required: true,
    unique:   true,   // e.g. "node_kalpani_upper"
    trim:     true,
  },

  name: {
    type:     String,
    required: true,   // e.g. "Upper Kalpani Entry Point"
  },

  // ── Location (hardcoded into each ESP32 mote's firmware) ─────────────────
  // Used by Leaflet.js to plot the node marker on the map.
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // ── Elevation (metres above sea level) ────────────────────────────────────
  // Critical for the directed graph — edges only go higher → lower.
  // Also used to calculate elevation_drop_m on canal edges.
  elevation_m: {
    type:     Number,
    required: true,
  },

  // ── Canal bankfull dimensions ──────────────────────────────────────────────
  // The physical size of the canal at this point.
  // canal_height_m: how deep the canal is from bank-top to bed.
  // canal_width_m:  how wide the canal is at bank-top level.
  // bankfull_capacity_m3: pre-calculated volume = height × width × 1m (per metre of length).
  // When water_height_m (from sensor) reaches canal_height_m → overflow risk.
  canal_height_m: {
    type:     Number,
    required: true,   // metres — the "bankfull" height threshold
  },

  canal_width_m: {
    type:     Number,
    required: true,   // metres
  },

  // ── Drainage catchment (fetched from external GIS/API, stored here) ────────
  // The surface area of land that drains INTO this canal point.
  // Used in the flood formula: V_pred = R × A × C
  catchment_area_m2: {
    type:    Number,
    default: 0,       // m² — populated via API call at deployment time
  },

  // ── Area topology (fetched from API, stored as descriptive string) ─────────
  // Describes the surrounding land cover at this node's catchment.
  // Drives the runoff_coefficient selection (see below).
  // Examples: "urban_dense", "agricultural", "rocky_hillside", "forest", "mixed"
  area_topology: {
    type:    String,
    enum:    ['urban_dense', 'urban_sparse', 'agricultural', 'rocky_hillside', 'forest', 'mixed', 'unknown'],
    default: 'unknown',
  },

  // ── Runoff coefficient (hardcoded based on area_topology) ─────────────────
  // Fraction of rainfall that actually enters the canal (vs soaks into ground).
  // 0.0 = all rain absorbed, 1.0 = all rain runs off into canal.
  // Reference values by topology:
  //   urban_dense   → 0.85–0.95  (concrete, minimal absorption)
  //   urban_sparse  → 0.65–0.75
  //   agricultural  → 0.45–0.65
  //   rocky_hillside→ 0.70–0.85  (hard surface, fast runoff)
  //   forest        → 0.20–0.40  (heavy absorption)
  //   mixed         → 0.55–0.70
  runoff_coefficient: {
    type:    Number,
    default: 0.70,
    min:     0,
    max:     1,
  },

  is_active: {
    type:    Boolean,
    default: true,    // set false if sensor is pulled for maintenance
  },

}, { timestamps: true });  // auto-adds createdAt, updatedAt

export default mongoose.model('CanalNode', canalNodeSchema);
