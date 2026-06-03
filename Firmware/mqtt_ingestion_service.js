// const mqtt = require('mqtt');
// const Telemetry = require('../src/models/Telemetry');
// const Node = require('../src/models/Node');

// function verifyCRC8(payload, receivedCrc) { /* unchanged */ }

// function calculateStatus(waterHeight, canalDepth) {
//     const ratio = waterHeight / canalDepth;
//     if (ratio > 0.85) return 'critical';
//     if (ratio > 0.60) return 'warning';
//     return 'normal';
// }

// const startIngestion = () => {
//     console.log('[MQTT] Starting ingestion service...');
    
//     const client = mqtt.connect('mqtt://localhost:1883');

//     client.on('connect', () => {
//         console.log('[MQTT] Subscribed to flood/telemetry');
//         client.subscribe('flood/telemetry');
//     });

//     console.log('[MQTT] Waiting for messages...');

//     client.on('message', async (topic, message) => {
//         try {
//             const rawData = JSON.parse(message.toString());
//             const { crc, ...payload } = rawData;

//             // 1. CRC check
//             if (!verifyCRC8(payload, crc)) {
//                 console.error(`[!] CRC fail — ${payload.mote_id} dropped`);
//                 return;
//             }

//             // 2. Range validation
//             if (payload.water_height <= 0 || payload.water_height > 15) {
//                 console.warn(`[!] Out-of-range — ${payload.mote_id} ignored`);
//                 return;
//             }

//             // 3. Save to Telemetry
//             await new Telemetry({
//                 nodeId:        payload.mote_id,
//                 water_level_m: payload.water_height,
//                 flow_rate_m3s: payload.flow_rate,
//                 temperature_k: payload.temp_k,
//                 raw_payload:   payload
//             }).save();

//             // 4. Fetch, mutate, save Node
//             const node = await Node.findOne({ nodeId: payload.mote_id });
//             if (!node) {
//                 console.warn(`[!] Node ${payload.mote_id} not found. Seed static data first.`);
//                 return;
//             }

//             node.calibratedWaterHeight = payload.water_height;
//             node.flowRate              = payload.flow_rate;
//             node.temperature           = payload.temp_k;
//             node.status                = calculateStatus(payload.water_height, node.canal_depth_m);
//             node.lastSeen              = new Date();

//             await node.save();

//             console.log(`[✓] ${payload.mote_id} — height: ${payload.water_height}m, status: ${node.status}`);

//         } catch (err) {
//             console.error('[MQTT] Ingestion error:', err.message);
//         }
//     });

//     client.on('error', (err) => {
//         console.error('[MQTT] Broker connection error:', err.message);
//     });
// };

// module.exports = { startIngestion };





const mqtt = require('mqtt');
const Telemetry = require('../src/models/Telemetry');
const Node = require('../src/models/Node');

/**
 * NOTE:
 * You MUST implement SAME CRC logic as ESP OR disable CRC for debugging.
 */
function verifyCRC8(payload, receivedCrc) {
    try {
        const base =
            `${payload.mote_id}|${payload.water_height}|${payload.flow_rate}|${payload.temp_k}`;

        let crc = 0x00;

        for (let i = 0; i < base.length; i++) {
            let extract = base.charCodeAt(i);

            for (let j = 8; j; j--) {
                let sum = (crc ^ extract) & 0x01;
                crc >>= 1;
                if (sum) crc ^= 0x8C;
                extract >>= 1;
            }
        }

        return crc === receivedCrc;
    } catch (err) {
        console.error('[CRC] Error:', err.message);
        return false;
    }
}

function calculateStatus(waterHeight, canalDepth) {
    if (!canalDepth || canalDepth === 0) return 'unknown';

    const ratio = waterHeight / canalDepth;

    if (ratio > 0.85) return 'critical';
    if (ratio > 0.60) return 'warning';
    return 'normal';
}

const startIngestion = () => {
    console.log('[MQTT] Starting ingestion service...');

    const client = mqtt.connect('mqtt://localhost:1883');

    // 🔥 CONNECTION DEBUG
    client.on('connect', () => {
        console.log('[MQTT] CONNECTED to broker');

        client.subscribe('flood/telemetry', (err) => {
            if (err) {
                console.error('[MQTT] Subscribe error:', err.message);
            } else {
                console.log('[MQTT] Subscribed to flood/telemetry');
            }
        });
    });

    client.on('error', (err) => {
        console.error('[MQTT] Broker error:', err.message);
    });

    console.log('[MQTT] Waiting for messages...');

    client.on('message', async (topic, message) => {
        console.log('\n================ MQTT MESSAGE ================');
        console.log('[TOPIC]', topic);
        console.log('[RAW]', message.toString());

        try {
            const rawData = JSON.parse(message.toString());

            console.log('[PARSED]', rawData);

            const { crc, ...payload } = rawData;

            console.log('[PAYLOAD]', payload);
            console.log('[CRC RECEIVED]', crc);

            // 🔥 VALIDATION: missing fields protection
            if (!payload.mote_id) {
                console.error('[!] Missing mote_id — skipping');
                return;
            }

            if (payload.water_height == null) {
                console.error('[!] Missing water_height — skipping');
                return;
            }

            // 🔥 CRC CHECK
            const crcValid = verifyCRC8(payload, crc);

            if (!crcValid) {
                // Test : just for testing, we can accept bad CRC but log a warning. In production, you should reject.
                console.warn('[CRC WARNING] accepting untrusted data');

                // console.error(`[!] CRC FAIL — ${payload.mote_id} dropped`);
                // return;
            }

            // 🔥 RANGE CHECK
            if (payload.water_height <= 0 || payload.water_height > 15) {
                // Test : just for testing, we can accept bad data but log a warning. In production, you should reject.
                console.warn('[Sensor data WARNING] accepting Incorrect data');
                
                // console.warn(`[!] Out-of-range — ${payload.mote_id} ignored`);
                // return;
            }

            // 🔥 SAVE TELEMETRY
            await new Telemetry({
                nodeId: payload.mote_id,
                water_level_m: payload.water_height,
                flow_rate_m3s: payload.flow_rate,
                temperature_k: payload.temp_k,
                raw_payload: payload
            }).save();

            // 🔥 UPDATE NODE
            const node = await Node.findOne({ nodeId: payload.mote_id });

            if (!node) {
                console.warn(`[!] Node not found: ${payload.mote_id}`);
                return;
            }

            node.calibratedWaterHeight = payload.water_height;
            node.flowRate = payload.flow_rate;
            node.temperature = payload.temp_k;
            node.status = calculateStatus(payload.water_height, node.canal_depth_m);
            node.lastSeen = new Date();

            await node.save();

            console.log(`[✓] STORED → ${payload.mote_id} | ${payload.water_height}m | ${node.status}`);

        } catch (err) {
            console.error('[MQTT] Processing error:', err.message);
        }
    });
};

module.exports = { startIngestion };