const mqtt = require('mqtt');
const mongoose = require('mongoose');

// --- Task 02: MongoDB Schema Integration ---
mongoose.connect('mongodb://localhost:27017/flood_system', { useNewUrlParser: true, useUnifiedTopology: true });

const TelemetrySchema = new mongoose.Schema({
    mote_id: String,
    water_height: Number,
    flow_rate: Number,
    temp_k: Number,
    location: { lat: Number, lon: Number },
    timestamp: { type: Date, default: Date.now }
});
const Telemetry = mongoose.model('Telemetry', TelemetrySchema);

// --- MQTT Setup ---
const broker_url = 'mqtt://localhost:1883';
const client = mqtt.connect(broker_url);

// --- Task 02: CRC-8 Verification Logic ---
function verifyCRC8(payload, receivedCrc) {
    let crc = 0x00;
    const dataStr = JSON.stringify(payload);
    for (let i = 0; i < dataStr.length; i++) {
        let extract = dataStr.charCodeAt(i);
        for (let j = 8; j; j--) {
            let sum = (crc ^ extract) & 0x01;
            crc >>= 1;
            if (sum) crc ^= 0x8C;
            extract >>= 1;
        }
    }
    return crc === receivedCrc;
}

client.on('connect', () => {
    console.log('Ingestion Service Online. Subscribed to flood/telemetry');
    client.subscribe('flood/telemetry');
});

client.on('message', async (topic, message) => {
    try {
        const rawData = JSON.parse(message.toString());
        const { crc, ...payload } = rawData;

        // 1. Task 02: Error Handling (CRC Verification)
        if (!verifyCRC8(payload, crc)) {
            console.error(`[!] Data Corruption Detected from ${payload.mote_id}. Packet Dropped.`);
            return;
        }

        // 2. Task 02: Data Validation (Filtering Outliers)
        if (payload.water_height <= 0 || payload.water_height > 15) {
            console.warn(`[!] Invalid Range: Mote ${payload.mote_id} reporting impossible height.`);
            return;
        }

        // 3. Task 02: Database Delivery (Ingestion)
        const newEntry = new Telemetry({
            mote_id: payload.mote_id,
            water_height: payload.water_height,
            flow_rate: payload.flow_rate,
            temp_k: payload.temp_k,
            location: { lat: payload.lat, lon: payload.lon }
        });

        await newEntry.save();
        console.log(`[✓] Data Streamed & Saved: ${payload.mote_id}`);

    } catch (err) {
        console.error("Critical Failure in Ingestion Loop:", err.message);
    }
});