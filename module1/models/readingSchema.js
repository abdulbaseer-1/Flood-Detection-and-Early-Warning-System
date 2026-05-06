//(sensor data)

// models/readingSchema.js
// One document = one sensor snapshot from one ESP32 mote.
// Written every few seconds via MQTT. Keep this schema LEAN.
// All units match the physical sensors exactly — no conversion here.

import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema({

  node_id: {
    type:     String,
    required: true,
    ref:      'CanalNode',   // ties this reading to a location in canal_nodes
  },

  // ── Water height (JSN-SR04T Ultrasonic Sensor) ────────────────────────────
  // The sensor measures the AIR GAP from sensor to water surface.
  // water_height_m = canal_height_m − air_gap_m
  // i.e. how full the canal is, in metres.
  // When this approaches canal_height_m → flood risk.
  water_height_m: {
    type:     Number,
    required: true,          // metres
  },

  // Raw air gap stored separately so your algorithm can re-derive if needed
  air_gap_m: {
    type:    Number,
    default: null,           // metres — direct ultrasonic measurement
  },

  // ── Water flow rate (YF-S201 Flow Sensor) ─────────────────────────────────
  // Measured in cubic metres per second (m³/s).
  // YF-S201 outputs pulses → your firmware converts to m³/s.
  // Cross-sectional area = canal_width_m × water_height_m.
  // flow_rate_m3s = pulse_frequency × calibration_factor
  flow_rate_m3s: {
    type:    Number,
    default: null,           // m³/s
    min:     0,
  },

  // ── Temperature (DHT22 Sensor) ────────────────────────────────────────────
  // Stored in KELVIN as specified.
  // Why Kelvin matters: the ultrasonic speed-of-sound formula uses Kelvin:
  //   speed_of_sound = 331.3 × sqrt(temperature_k / 273.15)  [m/s]
  // Your firmware uses this to calibrate the JSN-SR04T air gap reading.
  // Conversion if needed: temp_celsius = temperature_k - 273.15
  temperature_k: {
    type:    Number,
    default: null,           // Kelvin — range: ~273K (0°C) to ~323K (50°C) in Mardan
    min:     200,            // sanity check: below 200K is impossible in the field
    max:     400,
  },

  // ── Forecasted Rainfall (OpenWeatherMap API) ──────────────────────────────
  // NOT a live sensor reading — fetched from OpenWeatherMap by the backend
  // and stored alongside the sensor snapshot for the prediction formula.
  // Units: mm/hr (millimetres of rain per hour)
  // Used in: V_pred = R × A × C  (R = rainfall_mm_hr, A = catchment_area_m2, C = runoff_coefficient)
  rainfall_mm_hr: {
    type:    Number,
    default: 0,              // mm/hr — 0 means no forecast rain
    min:     0,
  },

  // ── Node status ───────────────────────────────────────────────────────────
  // Auto-set by pre-save hook based on sensor sanity checks.
  // Algorithm team uses this to skip SENSOR_MALFUNCTION nodes during prediction.
  status: {
    type:    String,
    enum:    ['OK', 'SENSOR_MALFUNCTION', 'OFFLINE', 'FLOOD_WARNING'],
    default: 'OK',
  },

  timestamp: {
    type:    Date,
    default: Date.now,
    required: true,
  },

}, {
  // Native MongoDB Time-Series collection — optimised storage for rapid inserts
  timeseries: {
    timeField:   'timestamp',
    metaField:   'node_id',    // one time-series per sensor node
    granularity: 'seconds',
  },
  timestamps: false,
});

// ── Sensor sanity validation ──────────────────────────────────────────────────
// Flags impossible readings before they enter the DB.
// Prevents a broken sensor from triggering a false flood alert.
sensorReadingSchema.pre('save', function(next) {

  // Ultrasonic sanity: 0m or >10m water height is physically impossible
  if (this.water_height_m <= 0 || this.water_height_m > 10) {
    this.status = 'SENSOR_MALFUNCTION';
    return next();
  }

  // Temperature sanity: outside 253K–333K (−20°C to 60°C) is impossible in field
  if (this.temperature_k !== null && (this.temperature_k < 253 || this.temperature_k > 333)) {
    this.status = 'SENSOR_MALFUNCTION';
    return next();
  }

  // Flow rate sanity: negative flow is impossible
  if (this.flow_rate_m3s !== null && this.flow_rate_m3s < 0) {
    this.status = 'SENSOR_MALFUNCTION';
    return next();
  }

  next();
});

export default mongoose.model('SensorReading', sensorReadingSchema);
