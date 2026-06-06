# 🌊 PROJECT FLOW - Complete Walkthrough
## Flood Detection and Early Warning System (AFPEWS)

---

## 📚 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Data Flow](#data-flow)
4. [File Structure](#file-structure)
5. [Component Breakdown](#component-breakdown)
6. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
7. [Real-World Scenario](#real-world-scenario)

---

## 🎯 Project Overview

### What is AFPEWS?
**AFPEWS** = **A**fghanistan **F**lood **P**rediction **E**arly **W**arning **S**ystem

It's an **IoT-based flood detection system** that:
- ✅ Monitors water levels at multiple sensor nodes
- ✅ Predicts flood risk using graph algorithms
- ✅ Displays real-time alerts on a web dashboard
- ✅ Sends early warnings to prevent loss of life

### Key Facts:
- **Type:** Wireless Sensor Network (WSN) with Backend API + React Dashboard
- **Purpose:** Real-time flood prediction for Kabul River and canals
- **Technology Stack:**
  - Backend: Node.js + Express + MongoDB
  - Frontend: React + Vite + Leaflet Maps
  - Hardware: ESP32 sensors with MQTT
  - APIs: OpenWeatherMap (rainfall), WebSockets (live alerts)

---

## 🏗️ System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHYSICAL SENSORS (ESP32)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Node-1      │  │  Node-2      │  │  Node-N      │           │
│  │ (Water Level)│  │ (Water Level)│  │ (Water Level)│           │
│  │ (Flow Rate)  │  │ (Flow Rate)  │  │ (Flow Rate)  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↓ MQTT Protocol
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND SERVER                             │
│                    (Node.js + Express)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  3 BACKGROUND SERVICES (run continuously)               │   │
│  │  ├─ MQTT Ingestion (receives sensor data)               │   │
│  │  ├─ Rainfall Poller (fetches weather API)               │   │
│  │  └─ Prediction Engine (calculates flood risk)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            MONGODB DATABASE                             │   │
│  │  ├─ Node Collection (sensor metadata + latest status)   │   │
│  │  └─ Telemetry Collection (time-series data)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            REST API ROUTES                              │   │
│  │  ├─ GET /api/nodes (all nodes)                          │   │
│  │  ├─ GET /api/nodes/:id (single node details)            │   │
│  │  ├─ GET /api/nodes/:id/history (time-series)            │   │
│  │  └─ POST /api/nodes/:id/status (update status)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    REACT DASHBOARD                              │
│                   (Runs on localhost:5173)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Live Map    │  │  Analytics   │  │  System      │           │
│  │  (Leaflet)   │  │  (Charts)    │  │  Alerts      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  • Displays sensor locations on interactive map                 │
│  • Shows real-time status (normal/warning/critical)             │
│  • Displays historical data in graphs                           │
│  • Shows flood alerts with timestamps                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Complete Data Journey (from sensor to dashboard):

```
1. SENSOR DATA GENERATION (ESP32)
   └─ Water level sensor reads: 1.5 meters
   └─ Flow rate sensor reads: 45 m³/s
   └─ Temperature sensor reads: 310K
   └─ Packages as JSON: {mote_id, water_height, flow_rate, temp_k}

2. MQTT PUBLICATION
   └─ ESP32 publishes to: mqtt://broker:1883/flood/telemetry
   └─ Message includes CRC checksum for error detection

3. BACKEND MQTT INGESTION SERVICE
   └─ Receives message from broker
   └─ Validates CRC checksum
   └─ Checks if water level is in valid range
   └─ Saves to Telemetry collection (time-series)
   └─ Updates Node collection with latest values

4. DATABASE UPDATE
   MongoDB Document:
   {
     nodeId: "Node-1",
     calibratedWaterHeight: 1.5,      ← Updated from sensor
     flowRate: 45,                     ← Updated from sensor
     temperature: 310,                 ← Updated from sensor
     rainfall: 25,                     ← Will be updated by rainfall poller
     status: "normal"                  ← Will be updated by prediction service
   }

5. RAINFALL DATA (Separate Service)
   └─ Rainfall poller runs every 10 minutes
   └─ Fetches weather from OpenWeatherMap API
   └─ Updates Node.rainfall field

6. PREDICTION ENGINE SERVICE
   └─ Runs every 60 seconds
   └─ Reads all nodes from database
   └─ Performs topological graph traversal:
      ├─ Starts with root nodes (no parents)
      ├─ Calculates local flood probability
      ├─ Passes risk downstream (inherited probability)
      ├─ Accumulates upstream contributions
      └─ Updates status: "normal" | "warning" | "critical"

7. API ENDPOINTS (REST)
   └─ Frontend requests: GET /api/nodes
   └─ Backend returns: [{nodeId, status, location, data...}, ...]

8. FRONTEND DISPLAY
   └─ React fetches from API
   └─ Displays on interactive map
   └─ Shows markers with colors:
      ├─ 🟢 Green = Normal
      ├─ 🟡 Yellow = Warning
      └─ 🔴 Red = Critical
```

---

## 📁 File Structure & Explanations

### Root Files
```
server.js                          ← ENTRY POINT (main file that starts everything)
├─ Loads environment variables (.env)
├─ Connects to MongoDB database
├─ Creates Express app
├─ Starts 3 background services
└─ Listens on port 5000
```

### Backend Structure

```
src/
├─ app.js                          ← EXPRESS APP SETUP
│  └─ Configures middleware (CORS, security, logging)
│  └─ Registers routes
│  └─ Sets up error handling
│
├─ config/
│  └─ db.js                        ← DATABASE CONNECTION
│     └─ Connects to MongoDB using mongoose
│
├─ models/                         ← DATABASE SCHEMAS
│  ├─ Node.js                      ← Represents a physical sensor node
│  │  └─ nodeId, location, waterHeight, flowRate, status, parentNodes...
│  │
│  └─ Telemetry.js                 ← Time-series sensor readings
│     └─ Stores historical data: nodeId, timestamp, water_level, flow_rate...
│
├─ routes/                         ← API ENDPOINTS
│  ├─ nodes.js                     ← Routes for node queries
│  │  ├─ GET /api/nodes            (get all nodes)
│  │  ├─ GET /api/nodes/:id        (get single node)
│  │  ├─ GET /api/nodes/:id/history (get telemetry history)
│  │  ├─ GET /api/nodes/:id/latest  (get latest reading)
│  │  └─ POST /api/nodes/:id/status (update status)
│  │
│  └─ demoStream.js                ← Demo data generation for testing
│     ├─ POST /api/demo/start      (start simulating flood scenario)
│     └─ POST /api/demo/stop       (stop simulation)
│
├─ controllers/                    ← BUSINESS LOGIC
│  └─ nodesController.js           ← Functions called by routes
│     ├─ getAllNodes()             (query all nodes from DB)
│     ├─ getNodeById()             (query single node)
│     ├─ getNodeHistory()          (query telemetry time-series)
│     ├─ getNodeLatest()           (get most recent reading)
│     ├─ getNodeGraph()            (get parent node relationships)
│     └─ updateNodeStatus()        (update node status)
│
├─ middleware/                     ← FUNCTIONS THAT RUN BEFORE ROUTES
│  ├─ errorHandler.js              ← Catches and formats errors
│  ├─ logger.js                    ← Logs all requests
│  └─ validate.js                  ← Validates request parameters
│
└─ Services/                       ← BACKGROUND JOBS (run continuously)
   ├─ predictionService.js         ← Flood prediction engine
   │  ├─ Runs every 60 seconds
   │  ├─ Reads all nodes from DB
   │  ├─ Performs topological sort (graph traversal)
   │  ├─ Calculates flood probability
   │  └─ Updates node status
   │
   ├─ singleNode.js                ← Single node prediction formula
   │  └─ Calculates: runoff, probability, status
   │
   ├─ networkNode.js               ← Network propagation formulas
   │  ├─ calculateUpstreamContribution()
   │  ├─ calculateInheritedProbability()
   │  └─ deriveLagFactor()
   │
   └─ rainfallPoller.js            ← Weather API integration
      ├─ Runs every 10 minutes
      ├─ Fetches rainfall from OpenWeatherMap
      └─ Updates Node.rainfall field
```

### Hardware & Firmware

```
Firmware/
├─ ESP32_Flood_Mote.ino            ← SENSOR CODE (runs on ESP32 device)
│  ├─ Reads water level sensor
│  ├─ Reads flow rate sensor
│  ├─ Reads temperature sensor
│  ├─ Packages data as JSON
│  ├─ Calculates CRC checksum
│  └─ Publishes to MQTT broker
│
└─ mqtt_ingestion_service.js       ← MQTT LISTENER SERVICE
   ├─ Connects to MQTT broker
   ├─ Listens for sensor messages
   ├─ Validates CRC
   ├─ Saves to Telemetry collection
   └─ Updates Node collection
```

### Frontend Structure

```
client-dashboard/
├─ src/
│  ├─ App.jsx                      ← MAIN COMPONENT
│  │  └─ Renders sidebar + active page
│  │
│  ├─ components/                  ← PAGE COMPONENTS
│  │  ├─ LiveMapPage.jsx           ← Interactive map with markers
│  │  │  ├─ Fetches all nodes via API
│  │  │  ├─ Displays map using Leaflet
│  │  │  ├─ Shows markers with colors (status)
│  │  │  └─ Polls API every 5 seconds for updates
│  │  │
│  │  ├─ NodeAnalyticsPage.jsx     ← Charts & graphs
│  │  │  ├─ Displays time-series charts
│  │  │  ├─ Shows water level over time
│  │  │  └─ Shows flow rate trends
│  │  │
│  │  ├─ SystemAlertsPage.jsx      ← Alert notifications
│  │  │  ├─ Lists all critical/warning nodes
│  │  │  ├─ Shows alert timestamps
│  │  │  └─ Color-coded by severity
│  │  │
│  │  └─ LiveDemoDashboard.jsx     ← Testing/demo interface
│  │     ├─ Button to start demo simulation
│  │     ├─ Displays demo data in real-time
│  │     └─ Useful for testing without real sensors
│  │
│  ├─ context/                     ← STATE MANAGEMENT
│  │  └─ NodeContext.jsx           ← Global state for node data
│  │
│  ├─ App.css                      ← Styling
│  ├─ tailwind.config.js           ← Tailwind CSS configuration
│  └─ vite.config.js               ← Vite bundler configuration
│
└─ package.json                    ← Frontend dependencies
   └─ react, leaflet, recharts, vite, tailwindcss
```

---

## 🔧 Component Breakdown

### 1️⃣ MQTT INGESTION SERVICE
**File:** `Firmware/mqtt_ingestion_service.js`

**Purpose:** Listens for sensor data from ESP32 devices

**Flow:**
```javascript
ESP32 sends: {
  mote_id: "Node-1",
  water_height: 1.5,      // meters
  flow_rate: 45,          // m³/s
  temp_k: 310,            // Kelvin
  crc: "A7"               // checksum
}

↓ MQTT Service receives

→ Validates CRC (error detection)
→ Checks if water_height is in valid range (0-15m)
→ Saves to Telemetry collection (historical record)
→ Updates Node collection:
  {
    calibratedWaterHeight: 1.5
    flowRate: 45
    temperature: 310
    lastSeen: <timestamp>
  }
```

---

### 2️⃣ RAINFALL POLLER SERVICE
**File:** `src/Services/rainfallPoller.js`

**Purpose:** Fetches rainfall data from weather API

**Flow:**
```javascript
Every 10 minutes:

For each node:
  1. Get its GPS coordinates (lon, lat)
  2. Call OpenWeatherMap API: 
     GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}
  3. Extract rainfall: response.data.rain['1h']
  4. Update Node:
     {
       rainfall: 25  // mm/hr
     }

Result: All nodes now have current rainfall data
```

---

### 3️⃣ PREDICTION ENGINE SERVICE
**File:** `src/Services/predictionService.js`

**Purpose:** Calculates flood risk for each node using graph algorithms

**Flow:**
```
Every 60 seconds:

1. READ ALL NODES FROM DATABASE
   └─ Get: nodeId, calibratedWaterHeight, flowRate, rainfall, parentNodes

2. BUILD TOPOLOGY
   └─ Create a directed graph showing which nodes flow into which nodes
   └─ Example:
      Node-A → Node-B → Node-D ┐
                                ├─→ Node-E (confluence)
                    Node-C ────┘

3. TOPOLOGICAL SORT (Process in dependency order)
   └─ Start with root nodes (no parents): Node-A, Node-C
   └─ Calculate their flood probability
   └─ Pass results to children: Node-B
   └─ Node-B receives upstream contribution from Node-A
   └─ Continue down to Node-D, then Node-E

4. FOR EACH NODE, CALCULATE:
   
   a) LOCAL RUNOFF (from rainfall)
      formula: (coefficient × rainfall × catchment_area) / 3600
      
   b) COMBINED FLOW
      formula: (sensorFlow + localRunoff + upstreamContribution) × surgeMultiplier
      
   c) FLOOD PROBABILITY
      formula: MAX(fillRatio, capacityRatio) × 100
      Where: fillRatio = waterHeight / canalDepth
             capacityRatio = totalFlow / maxRatedFlow
      
   d) STATUS
      if probability ≥ 85% → "critical" 🚨
      else if probability ≥ 50% → "warning" ⚠️
      else → "normal" ✅

5. UPDATE DATABASE
   └─ Save new status for each node
   └─ Save upstreamContribution value
   └─ Save timestamp
```

**Example Calculation:**
```
Node-B receives from Node-A:

Node-A results:
  - combinedFlow: 100 m³/s
  - floodProbability: 75%

Node-B:
  - Distance from Node-A: 5km
  - Lag factor (distance decay): e^(-5000/15000) = 0.717
  
  - Upstream contribution: 100 × 0.717 = 71.7 m³/s
  - Inherited probability: 75 × 0.717 = 53.8%
  
  - Local water height: 1.0m
  - Local flood probability: (1.0 / 2.5) × 100 = 40%
  
  - Final flood probability: MAX(40%, 53.8%) = 53.8% → WARNING
```

---

### 4️⃣ REST API ROUTES
**File:** `src/routes/nodes.js`

**API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/nodes` | Get all nodes |
| GET | `/api/nodes/:id` | Get single node details |
| GET | `/api/nodes/:id/history` | Get telemetry history (24h default) |
| GET | `/api/nodes/:id/latest` | Get most recent reading |
| GET | `/api/nodes/:id/graph` | Get parent nodes (topology) |
| POST | `/api/nodes/:id/status` | Update node status |

**Example Request/Response:**
```javascript
// Request
GET /api/nodes/Node-1

// Response
{
  success: true,
  data: {
    nodeId: "Node-1",
    label: "Kabul North A",
    location: { type: "Point", coordinates: [69.2, 34.5] },
    calibratedWaterHeight: 1.5,
    flowRate: 45.2,
    rainfall: 25,
    status: "warning",
    canal_depth_m: 3.0,
    bankfull_capacity_m3: 150,
    parentNodes: [],
    lastSeen: "2026-06-06T10:30:45.123Z"
  }
}
```

---

### 5️⃣ REACT DASHBOARD
**File:** `client-dashboard/src/components/`

**4 Main Pages:**

#### a) Live Map Page
```javascript
// What it does:
1. Fetches GET /api/nodes (all nodes)
2. Renders Leaflet map centered on Kabul
3. Places markers for each node
4. Colors markers by status:
   - GREEN (normal): No flood risk
   - YELLOW (warning): 50-84% probability
   - RED (critical): 85%+ probability
5. Polls API every 5 seconds for updates
6. Shows node name and status on hover

// Features:
- Interactive map (pan, zoom)
- Click marker to see details
- Real-time color updates
```

#### b) Node Analytics Page
```javascript
// What it does:
1. Displays time-series charts
2. Shows water level history (past 24h)
3. Shows flow rate trends
4. Shows rainfall graph
5. Uses Recharts library for visualization

// Example:
  Water Level (m)
  3.0 |     ╱╲
  2.5 |    ╱  ╲
  2.0 |   ╱    ╲
  1.5 |  ╱      ╲
  1.0 | ╱________╲
  0.0 └──────────────
      00:00  12:00  24:00 (hours)
```

#### c) System Alerts Page
```javascript
// What it does:
1. Lists all nodes with status = "warning" or "critical"
2. Shows alert timestamp
3. Shows node name and location
4. Color-coded by severity
5. Sorted by most recent first

// Example Alert:
[🚨] CRITICAL - Node-5 (Jalalabad Canal)
    Last Update: 10:30:45 AM
    Probability: 92%
    
[⚠️] WARNING - Node-2 (Kabul North A)
    Last Update: 10:28:12 AM
    Probability: 67%
```

#### d) Live Demo Dashboard
```javascript
// What it does:
1. Allows manual testing without real sensors
2. Buttons to start/stop demo scenarios:
   - "Ramp": Gradual water level increase
   - "Spike": Sudden flood pulse
3. Simulates multiple nodes simultaneously
4. Generates realistic data progression

// Usage:
Click "Start Demo" → Simulates flood scenario
  → Data gets updated in database
  → Dashboard updates live
  → Users see warnings in real-time

// Good for:
- Testing before real sensors
- Demonstrating to stakeholders
- Training users
```

---

## 📋 Step-by-Step Walkthrough

### Starting the System

**Step 1: Server Startup**
```bash
npm start
# or for development:
npm run dev
```

**server.js executes:**
```javascript
1. Load environment variables from .env
2. Connect to MongoDB
3. Create Express app (configure routes, middleware)
4. Start HTTP server on port 5000
5. Start 3 background services:
   ├─ MQTT ingestion service (listening on broker)
   ├─ Rainfall poller (fetching weather API)
   └─ Prediction service (calculating flood risk)
6. Print: "🚀 AFPEWS API running on http://localhost:5000"
```

**Output in console:**
```
[✓] MongoDB connected
[MQTT] Starting ingestion service...
[MQTT] Subscribed to flood/telemetry
[Rain] Poller started — updating every 10 minutes
[Predict] Running every 60 seconds
🚀 AFPEWS API running on http://localhost:5000
```

---

### Step 2: Sensor Data Arrives

**ESP32 sends MQTT message:**
```json
{
  "mote_id": "Node-1",
  "water_height": 1.5,
  "flow_rate": 45.2,
  "temp_k": 310,
  "crc": "A7"
}
```

**MQTT Service processes:**
```javascript
[✓] Node-1 — height: 1.5m, status: normal
    Saved to Telemetry
    Updated Node collection
```

---

### Step 3: Rainfall Update (Every 10 minutes)

**Rainfall service runs:**
```javascript
[Rain] Polling rainfall for all nodes...
[Rain] Node-1 → 25 mm/hr
[Rain] Node-2 → 18 mm/hr
[Rain] Node-3 → 30 mm/hr
[Rain] Poll complete — 3/3 nodes updated
```

---

### Step 4: Prediction Cycle (Every 60 seconds)

**Prediction service runs:**
```javascript
[Predict] ── Cycle start ──────────────────────
[Predict] Node-1                   prob: 40% | status: normal   | up: 0.00 m³/s
[Predict] Node-2                   prob: 55% | status: warning  | up: 31.5 m³/s
[Predict] Node-3                   prob: 72% | status: warning  | up: 51.2 m³/s
[Predict] ── Cycle complete ──
```

---

### Step 5: Frontend Fetches Data

**React app makes requests:**
```javascript
// Every 5 seconds:
fetch('http://localhost:5000/api/nodes')
  .then(res => res.json())
  .then(data => {
    // Update markers on map
    // Update status colors
    // Render alerts
  })
```

**API Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "nodeId": "Node-1",
      "status": "normal",
      "location": { "coordinates": [69.2, 34.5] },
      "calibratedWaterHeight": 1.5,
      "prediction": { "floodProbability": 40 }
    },
    {
      "nodeId": "Node-2",
      "status": "warning",
      "location": { "coordinates": [69.3, 34.6] },
      "calibratedWaterHeight": 2.1,
      "prediction": { "floodProbability": 55 }
    },
    {
      "nodeId": "Node-3",
      "status": "warning",
      "location": { "coordinates": [69.4, 34.7] },
      "calibratedWaterHeight": 2.8,
      "prediction": { "floodProbability": 72 }
    }
  ]
}
```

---

### Step 6: Dashboard Display

**React renders:**
```
┌─────────────────────────────────┐
│        AFPEWS DASHBOARD         │
├─────────────────────────────────┤
│ Live Map Page                   │
│                                 │
│  [Map of Afghanistan]           │
│   🟢 Node-1 (40%)              │
│   🟡 Node-2 (55%) ⚠️            │
│   🟡 Node-3 (72%) ⚠️            │
│                                 │
│  System Alerts:                 │
│  ⚠️ 2 warnings active           │
│  Last update: 10:30:45          │
└─────────────────────────────────┘
```

---

## 🌊 Real-World Scenario: Flood Event

### Hour 0: Normal Operations
```
Time: 06:00 AM
Weather: Light rain (5 mm/hr)

Node-1: Water 0.8m (27% of depth 3m) → Status: NORMAL ✅
Node-2: Water 1.2m (40% of depth 3m) → Status: NORMAL ✅
Node-3: Water 0.6m (20% of depth 3m) → Status: NORMAL ✅

Dashboard shows: All 🟢 green markers
```

### Hour 1: Rain Intensifies
```
Time: 07:00 AM
Weather: Heavy rain (40 mm/hr)
Upstream node (Node-1) rises rapidly

Node-1: Water 2.4m (80% of depth 3m) → Status: WARNING ⚠️
  - High water from rainfall and terrain runoff
  
Node-2: Water 1.5m (50% of depth 3m) → Status: WARNING ⚠️
  - Receives upstream contribution (flood wave starting)
  - Local rainfall also increasing
  
Node-3: Water 0.9m (30% of depth 3m) → Status: NORMAL ✅

Dashboard shows: 2 🟡 yellow markers, 1 🟢 green marker
```

### Hour 2: Crisis Develops
```
Time: 08:00 AM
Weather: Very heavy rain (60 mm/hr)
Peak runoff from upstream

Node-1: Water 3.2m (107% - OVERFLOW) → Status: CRITICAL 🚨
  - Probability: 150% (beyond bankfull capacity)
  - ALERT SENT: "Jalalabad Canal flooding!"
  
Node-2: Water 2.8m (93% - NEAR OVERFLOW) → Status: CRITICAL 🚨
  - Probability: 110%
  - Receives huge upstream contribution from Node-1
  - ALERT SENT: "Kabul Canal critical!"
  
Node-3: Water 2.1m (70%) → Status: WARNING ⚠️
  - Receives downstream flood wave
  - Still manageable but rising

Dashboard shows: 2 🔴 red markers, 1 🟡 yellow marker
System Alerts page: "2 CRITICAL alerts active"
Alert notifications: Pop-up warnings on all devices
```

### Hour 3: System Controls Activated
```
Time: 09:00 AM
Weather: Rain stopping, but downstream still at risk

Based on warnings:
- Officials open flood gates upstream
- Communities downstream evacuate
- Early Warning System has done its job!

Node-1: Water dropping (gates open) → CRITICAL 🚨 → WARNING ⚠️
Node-2: Water stabilized → CRITICAL 🚨 → WARNING ⚠️
Node-3: Water peaking → WARNING ⚠️ → WARNING ⚠️

Status updates in real-time on dashboard
```

---

## 🔗 How Everything Connects

```
SENSOR ────────────→ MQTT BROKER ────────→ BACKEND
(ESP32)             (mosquitto)           (Node.js)
                                            ↓
                                         3 Services:
                                         ├─ Ingestion (saves data)
                                         ├─ Rainfall (weather API)
                                         └─ Prediction (calculates risk)
                                            ↓
                                         MONGODB
                                         (Node collection)
                                            ↓
                                         REST API
                                         (/api/nodes)
                                            ↓
                                         REACT APP
                                         (Dashboard)
                                            ↓
                                         USER SEES
                                         (Map + Alerts)
```

---

## 📊 Data Model Relationships

```
┌─────────────────────────────────────────┐
│  Node Collection (MongoDB)              │
├─────────────────────────────────────────┤
│ nodeId (unique): "Node-1"               │
│ label: "Kabul North A"                  │
│ location: { lon: 69.2, lat: 34.5 }      │
│ canal_depth_m: 3.0                      │
│ bankfull_capacity_m3: 150               │
│                                          │
│ ─── Dynamic Fields (updated by service) │
│ calibratedWaterHeight: 1.5              │
│ flowRate: 45.2                          │
│ rainfall: 25                            │
│ status: "warning"                       │
│ upstreamContribution: 31.5              │
│                                          │
│ ─── Topology                            │
│ parentNodes: [                          │
│   { nodeId: "Node-A", distance_m: 5000 │
│ ]                                       │
└─────────────────────────────────────────┘
                    1 : N
                    ↓
┌─────────────────────────────────────────┐
│  Telemetry Collection (MongoDB)         │
├─────────────────────────────────────────┤
│ nodeId: "Node-1"                        │
│ timestamp: 2026-06-06T10:30:45.123Z     │
│ water_level_m: 1.5                      │
│ flow_rate_m3s: 45.2                     │
│ temperature_k: 310                      │
│ rainfall_mmhr: 25                       │
│                                          │
│ (hundreds of records per node)          │
└─────────────────────────────────────────┘
```

---

## ✅ Key Takeaways

### 1. **Three Continuous Services**
- MQTT Ingestion → Receives sensor data
- Rainfall Poller → Gets weather data
- Prediction Engine → Calculates flood risk

### 2. **Two Data Collections**
- **Node**: Current state (latest values + metadata)
- **Telemetry**: Historical time-series

### 3. **Four Frontend Pages**
- Live Map → Visual overview
- Analytics → Historical trends
- Alerts → Critical notifications
- Demo → Testing interface

### 4. **Graph-Based Predictions**
- Nodes connected as directed graph
- Topological sort for processing order
- Flood risk propagates downstream
- Distance decay (lag factor)

### 5. **Real-Time Updates**
- API polls every 5 seconds
- Services update every 60 seconds
- Alerts trigger immediately on status change
- Dashboard reflects changes in real-time

---

## 🎓 Learning Path

### To understand the flow better, read in this order:

1. **server.js** → Understand bootstrap process
2. **src/app.js** → See how Express is configured
3. **src/models/Node.js** → Understand data structure
4. **Firmware/mqtt_ingestion_service.js** → See where data comes from
5. **src/Services/predictionService.js** → Understand prediction logic
6. **src/routes/nodes.js** → See API endpoints
7. **src/controllers/nodesController.js** → See how controllers work
8. **client-dashboard/src/App.jsx** → See frontend structure
9. **client-dashboard/src/components/LiveMapPage.jsx** → See how data is displayed

---

## 🚀 Running the System

```bash
# Terminal 1 - Backend
cd Flood-Detection-and-Early-Warning-System
npm install
npm run dev

# Terminal 2 - Frontend
cd client-dashboard
npm install
npm run dev

# Terminal 3 - Demo (optional, to simulate sensors)
# Use the "Live Demo Feed" page in dashboard
# Click "Start Demo" button
```

**Access:**
- Backend: http://localhost:5000
- Frontend: http://localhost:5173
- API Health: http://localhost:5000/health

---

**Now you understand the complete project flow! 🎉**
