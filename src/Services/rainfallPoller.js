const axios = require('axios');
const Node = require('../models/Node');

const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
const POLL_INTERVAL_MS = 10 * 60 * 1000; // Poll every 5 minutes

async function fetchRainfallForNode(node) {
    const [lon, lat] = node.location.coordinates;

    const url = `https://api.openweathermap.org/data/2.5/weather` +
                `?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`;

    const response = await axios.get(url, { timeout: 8000 });
    const rainfall_mmhr = response.data?.rain?.['1h'] ?? 0;

    return rainfall_mmhr;
}

async function pollAllNodes() {
    console.log('[Rain] Polling rainfall for all nodes...');

    const nodes = await Node.find({})
        .select('nodeId location')
        .lean();

    if (!nodes.length) {
        console.warn('[Rain] No nodes found in DB. Skipping poll.');
        return;
    }

    const results = await Promise.allSettled(
        nodes.map(async (node) => {
            const rainfall_mmhr = await fetchRainfallForNode(node);

            await Node.findOneAndUpdate(
                { nodeId: node.nodeId },
                { $set: { rainfall: rainfall_mmhr } }
            );

            console.log(`[Rain] ${node.nodeId} → ${rainfall_mmhr} mm/hr`);
        })
    );

    results.forEach((result, i) => {
        if (result.status === 'rejected') {
            console.error(`[Rain] Failed for ${nodes[i].nodeId}:`, result.reason.message);
        }
    });

    console.log(`[Rain] Poll complete — ${results.filter(r => r.status === 'fulfilled').length}/${nodes.length} nodes updated.`);
}

const startRainfallPoller = () => {

        console.log('[Rain] API Key loaded:', OWM_API_KEY ? 'YES' : 'NO — CHECK .env');

    if (!OWM_API_KEY) {
        console.error('[Rain] OPENWEATHER_API_KEY not set. Rainfall polling disabled.');
        return;
    }

    pollAllNodes();
    setInterval(() => pollAllNodes(), POLL_INTERVAL_MS);

    console.log(`[Rain] Poller started — updating every ${POLL_INTERVAL_MS / 60000} minutes.`);
};

module.exports = { startRainfallPoller };