//(dummy Mardan data)

// seed/seed.js
import dotenv from 'dotenv'
import mongoose from "mongoose";
import CanalNode from "../models/nodeSchema.js";
import CanalEdge  from "../models/edgeSchema.js";
import SensorReading from "../models/readingSchema.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/afpews';

const toKelvin = (c) => parseFloat((c + 273.15).toFixed(2));

const RUNOFF_BY_TOPOLOGY = {
  urban_dense:    0.90,
  urban_sparse:   0.70,
  agricultural:   0.55,
  rocky_hillside: 0.78,
  forest:         0.30,
  mixed:          0.62,
  unknown:        0.65,
};

const nodes = [
  {
    node_id:            'node_kalpani_upper',
    name:               'Upper Kalpani Entry',
    location:           { lat: 34.2080, lng: 72.0450 },
    elevation_m:        312,
    canal_height_m:     2.2,
    canal_width_m:      4.5,
    catchment_area_m2:  45000,
    area_topology:      'rocky_hillside',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['rocky_hillside'],
  },
  {
    node_id:            'node_rustam_branch',
    name:               'Rustam Branch Split',
    location:           { lat: 34.1965, lng: 72.0512 },
    elevation_m:        295,
    canal_height_m:     1.8,
    canal_width_m:      3.8,
    catchment_area_m2:  32000,
    area_topology:      'agricultural',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['agricultural'],
  },
  {
    node_id:            'node_mardan_central',
    name:               'Mardan Central Canal',
    location:           { lat: 34.1980, lng: 72.0441 },
    elevation_m:        280,
    canal_height_m:     2.0,
    canal_width_m:      5.0,
    catchment_area_m2:  28000,
    area_topology:      'urban_sparse',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['urban_sparse'],
  },
  {
    node_id:            'node_lower_drain_B',
    name:               'Lower Drain Point B',
    location:           { lat: 34.1830, lng: 72.0502 },
    elevation_m:        258,
    canal_height_m:     1.5,
    canal_width_m:      3.2,
    catchment_area_m2:  15000,
    area_topology:      'agricultural',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['agricultural'],
  },
  {
    node_id:            'node_lower_drain_A',
    name:               'Lower Drain Point A',
    location:           { lat: 34.1850, lng: 72.0388 },
    elevation_m:        261,
    canal_height_m:     1.6,
    canal_width_m:      3.5,
    catchment_area_m2:  18000,
    area_topology:      'mixed',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['mixed'],
  },
  {
    node_id:            'node_merge_point',
    name:               'Merge Point',
    location:           { lat: 34.1760, lng: 72.0445 },
    elevation_m:        248,
    canal_height_m:     2.8,
    canal_width_m:      7.0,
    catchment_area_m2:  0,
    area_topology:      'urban_dense',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['urban_dense'],
  },
  {
    node_id:            'node_outlet_swabi_road',
    name:               'Swabi Road Outfall',
    location:           { lat: 34.1700, lng: 72.0430 },
    elevation_m:        240,
    canal_height_m:     3.0,
    canal_width_m:      8.0,
    catchment_area_m2:  60000,
    area_topology:      'urban_dense',
    runoff_coefficient: RUNOFF_BY_TOPOLOGY['urban_dense'],
  },
];

const edges = [
  { from_node_id: 'node_kalpani_upper',  to_node_id: 'node_rustam_branch',     distance_m: 1400, elevation_drop_m: 17, flow_velocity_mps: 0.50 },
  { from_node_id: 'node_kalpani_upper',  to_node_id: 'node_mardan_central',    distance_m: 1100, elevation_drop_m: 32, flow_velocity_mps: 0.61 },
  { from_node_id: 'node_rustam_branch',  to_node_id: 'node_lower_drain_B',     distance_m: 1600, elevation_drop_m: 37, flow_velocity_mps: 0.44 },
  { from_node_id: 'node_mardan_central', to_node_id: 'node_lower_drain_A',     distance_m: 1300, elevation_drop_m: 19, flow_velocity_mps: 0.50 },
  { from_node_id: 'node_lower_drain_B',  to_node_id: 'node_merge_point',       distance_m:  900, elevation_drop_m: 10, flow_velocity_mps: 0.46 },
  { from_node_id: 'node_lower_drain_A',  to_node_id: 'node_merge_point',       distance_m:  700, elevation_drop_m: 13, flow_velocity_mps: 0.50 },
  { from_node_id: 'node_merge_point',    to_node_id: 'node_outlet_swabi_road', distance_m: 1700, elevation_drop_m:  8, flow_velocity_mps: 0.42 },
];

// ── Realistic reading config ──────────────────────────────────────────────────
const fillRatios = {
  node_kalpani_upper:     0.72,
  node_rustam_branch:     0.58,
  node_mardan_central:    0.61,
  node_lower_drain_B:     0.40,
  node_lower_drain_A:     0.43,
  node_merge_point:       0.28,
  node_outlet_swabi_road: 0.18,
};

const rainfallByNode = {
  node_kalpani_upper:     7.8,
  node_rustam_branch:     6.2,
  node_mardan_central:    5.5,
  node_lower_drain_B:     4.1,
  node_lower_drain_A:     4.4,
  node_merge_point:       3.8,
  node_outlet_swabi_road: 3.2,
};

const tempByNode = {
  node_kalpani_upper:     311.2,
  node_rustam_branch:     310.8,
  node_mardan_central:    310.5,
  node_lower_drain_B:     309.9,
  node_lower_drain_A:     310.1,
  node_merge_point:       309.4,
  node_outlet_swabi_road: 308.9,
};

// ── Seed function ─────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  await CanalNode.deleteMany({});
  await CanalEdge.deleteMany({});
  await SensorReading.deleteMany({});
  console.log('Cleared old data');

  await CanalNode.insertMany(nodes);
  console.log(`Seeded ${nodes.length} canal nodes`);

  for (const edge of edges) {
    await new CanalEdge(edge).save();
  }
  console.log(`Seeded ${edges.length} canal edges`);

  const fakeReadings = nodes.map(n => {           
    const water_height = noise(fill * n.canal_height_m, 0.005);
    const air_gap      = parseFloat((n.canal_height_m - water_height).toFixed(4));

    const velocity_estimate = 0.3 + (fill * 0.4);
    const flow_rate = noise(
      parseFloat((n.canal_width_m * water_height * velocity_estimate).toFixed(4)),
      0.002
    );

    return {
      node_id:        n.node_id,
      water_height_m: Math.max(0.01, water_height),
      air_gap_m:      Math.max(0.01, air_gap),
      flow_rate_m3s:  Math.max(0,    flow_rate),
      temperature_k:  noise(tempByNode[n.node_id], 0.15),
      rainfall_mm_hr: noise(rainfallByNode[n.node_id], 0.3),
      status:         'OK',
      timestamp:      new Date(),
    };
  });

  await SensorReading.insertMany(fakeReadings);
  console.log(`Seeded ${fakeReadings.length} sample readings\n`);
  console.log('Sample reading:\n', JSON.stringify(fakeReadings[0], null, 2));

  await mongoose.disconnect();
  console.log('\nDone.');
}

seed().catch(console.error);
