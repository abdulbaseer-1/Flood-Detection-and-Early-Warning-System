WRAP IN NODE JS WORKER THREAD
---

### **Language & Environment**
*   **Language:** JavaScript (Node.js)
*   **Libraries:**
    *   **Testing:** Jest (Standard for logic validation)
    *   **Math:** Standard `Math` (or `decimal.js` for high-precision floating point operations)

### **Unit Standardization**
To prevent calculation drift, all internal engine operations must normalize to these units:
*   **Rainfall:** $mm/hr$ (Input) $\rightarrow$ converted to $m/s$ (Internal)
*   **Area:** $m^2$
*   **Time:** Seconds ($s$)
*   **Distance:** Meters ($m$)
*   **Volume Flow:** $m^3/s$

---

### **Sensor & Mote Data Strategy**
*Edge Processing: Motes perform basic calibration to reduce MQTT payload size and server CPU load.*

*   **Ultrasonic Sensor:** Measures "Air Gap." Mote calculates **Water Height (m)** by subtracting gap from `canalDepth`, adjusted for local temperature.
*   **Water Flow Sensor:** Measures pulses to calculate **Volume Flow Rate ($m^3/s$)**.
*   **Rainfall Data:** Pulls from OpenWeatherMap API ($mm/hr$) based on mote coordinates.
*   **Elevation:** Static value (m) used to calculate the hydraulic gradient (slope) between nodes.
*   **Temperature (K):** Used for Speed of Sound calibration: $c \approx 20.05 \sqrt{T}$.

---

### **Core Variables**
*   **R:** Forecasted rainfall rate ($mm/hr$).
*   **A:** Surface area of the immediate drainage catchment ($m^2$).
*   **C:** Runoff coefficient ($0.0 \dots 1.0$) based on Area Topology (e.g., Concrete vs. Soil).
*   **V_upstream:** Accumulated water volume ($m^3/s$) from parent nodes.
*   **lag_factor:** Multiplier representing transmission efficiency and time-to-impact (includes evaporation/absorption loss).

---

### **1. Prediction Function (Independent Single Node)**
*Calculates localized risk without considering upstream flow.*

**Parameters:**
*   **Static (Mapped via Hex ID):** `moteId`, `location`, `elevation`, `catchmentArea`, `runoffCoefficient`, `canalDepth`, `maxCapacity`.
*   **Dynamic (Telemetry):** `calibratedWaterHeight`, `flowRate`, `temperature`, `rainfall`.

**Workflow:**
1.  **Sync Temperature:** Calibrate sound speed every 60s.
2.  **Calibrate Height:** Adjust ultrasonic reading for current temperature.
3.  **Calculate Runoff:** Convert $mm/hr$ to $m^3/s$ using $(R \times A \times C) / 3600$.
4.  **Evaluate Local Total:** $\text{TotalOut} = \text{CurrentFlow} + \text{LocalRunoff}$.
5.  **Risk Analysis:** $\text{Probability} = (\text{TotalOut} / \text{MaxCapacity}) \times 100$.

**Output Object:**
```json
{
  "moteId": "0x4A1",
  "coordinates": { "lat": 34.19, "lng": 72.04 },
  "elevation": 285.5,
  "metrics": {
    "waterHeight": 1.45,
    "flowRate": 0.85,
    "localRunoff": 0.12
  },
  "prediction": {
    "totalVolumeOut": 0.97,
    "floodProbability": 72.5,
    "riskLevel": "Yellow"
  }
}
```

---

### **2. Additive Prediction Function (Network Combined)**
*Fuses the Single Node output with Parent Node data.*

**Workflow:**
1.  **Retrieve Parents:** Identify parent Hex IDs via `edgeMap`.
2.  **Accumulate Upstream:** Sum all $(\text{Parent.totalVolumeOut} \times \text{lag\_factor})$.
3.  **Final Fusion:** Add `UpstreamAccumulation` to the `SingleNode.totalVolumeOut`.
4.  **Systemic Risk:** Update `floodProbability` and `riskLevel` based on the new combined volume.

---

### **3. Synchronization Function (Graph Traversal)**
*Orchestrates the order of operations to ensure data integrity.*

**Logic:** **Topological Sort (Kahn's Algorithm)**
*   **Step 1:** Map all nodes and identify "Roots" (nodes with no upstream parents).
*   **Step 2:** Queue Root nodes for calculation.
*   **Step 3:** For each node in the queue, execute the Combined Prediction.
*   **Step 4:** Once a node is finished, "unlock" its children for calculation.
*   **Goal:** Ensures Node B (Child) never calculates until Node A (Parent) has provided its final `totalVolumeOut`.

---

### **Key Refinement Notes for Development**
*   **Hex ID Mapping:** Use a `Map` or `Object` in Node.js where keys are Hex IDs for $O(1)$ lookup speed during recursion.
*   **Edge Map:** Maintain a separate data structure for connections: `{"0x4A1_0x4A2": { "lagFactor": 0.98 }}`.
*   **Safety Guard:** If `totalVolumeOut` exceeds `maxCapacity`, hard-cap the `floodProbability` at $100\%$ for the UI, but keep the raw volume for downstream calculations to model the severity of the overflow.