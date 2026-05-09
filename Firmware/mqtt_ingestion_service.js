const mqtt = require('mqtt');
const Telemetry = require('../src/models/Telemetry');
const Node = require('../src/models/Node');

function verifyCRC8(payload, receivedCrc) { /* unchanged */ }

function calculateStatus(waterHeight, canalDepth) {
    const ratio = waterHeight / canalDepth;
    if (ratio > 0.85) return 'critical';
    if (ratio > 0.60) return 'warning';
    return 'normal';
}

const startIngestion = () => {
    const client = mqtt.connect('mqtt://localhost:1883');

    client.on('connect', () => {
        console.log('[MQTT] Subscribed to flood/telemetry');
        client.subscribe('flood/telemetry');
    });

    client.on('message', async (topic, message) => {
        try {
            const rawData = JSON.parse(message.toString());
            const { crc, ...payload } = rawData;

            // 1. CRC check
            if (!verifyCRC8(payload, crc)) {
                console.error(`[!] CRC fail — ${payload.mote_id} dropped`);
                return;
            }

            // 2. Range validation
            if (payload.water_height <= 0 || payload.water_height > 15) {
                console.warn(`[!] Out-of-range — ${payload.mote_id} ignored`);
                return;
            }

            // 3. Save to Telemetry
            await new Telemetry({
                nodeId:        payload.mote_id,
                water_level_m: payload.water_height,
                flow_rate_m3s: payload.flow_rate,
                temperature_k: payload.temp_k,
                raw_payload:   payload
            }).save();

            // 4. Fetch, mutate, save Node
            const node = await Node.findOne({ nodeId: payload.mote_id });
            if (!node) {
                console.warn(`[!] Node ${payload.mote_id} not found. Seed static data first.`);
                return;
            }

            node.calibratedWaterHeight = payload.water_height;
            node.flowRate              = payload.flow_rate;
            node.temperature           = payload.temp_k;
            node.status                = calculateStatus(payload.water_height, node.canal_depth_m);
            node.lastSeen              = new Date();

            await node.save();

            console.log(`[✓] ${payload.mote_id} — height: ${payload.water_height}m, status: ${node.status}`);

        } catch (err) {
            console.error('[MQTT] Ingestion error:', err.message);
        }
    });

    client.on('error', (err) => {
        console.error('[MQTT] Broker connection error:', err.message);
    });
};

module.exports = { startIngestion };