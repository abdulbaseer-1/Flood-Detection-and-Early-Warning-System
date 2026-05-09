'use strict';

const Node = require('../models/Node');
const { predictSingleNode } = require('./singleNode');
const { 
    calculateUpstreamContribution, 
    calculateInheritedProbability 
} = require('./networkNode');

const POLL_INTERVAL_MS = 60 * 1000;

function toConfig(node) {
    return {
        nodeId: node.nodeId,
        canalDepth: node.canal_depth_m,
        catchmentArea: node.catchment_area_m2,
        runoffCoefficient: node.runoff_coefficient,
        maxRatedFlow: node.bankfull_capacity_m3,
    };
}

function toTelemetry(node) {
    return {
        waterHeight: node.calibratedWaterHeight ?? 0,
        flowRate: node.flowRate ?? 0,
        rainfall_mmhr: node.rainfall ?? 0,
    };
}

function buildTopology(nodes) {
    const inDegree = {};
    const children = {};
    nodes.forEach(n => {
        inDegree[n.nodeId] = 0;
        children[n.nodeId] = [];
    });
    nodes.forEach(n => {
        (n.parentNodes ?? []).forEach(p => {
            inDegree[n.nodeId]++;
            children[p.nodeId].push(n.nodeId);
        });
    });
    return { inDegree, children };
}

async function runPredictions() {
    console.log('\n[Predict] ── Cycle start ──────────────────────────────');
    const nodes = await Node.find({}).lean();
    if (!nodes.length) return;

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.nodeId] = n; });

    const { inDegree, children } = buildTopology(nodes);
    const resultMap = {}; 
    const pendingUpstream = {}; 
    const pendingProb = {}; 

    // Start with root nodes (those with no parents)
    const queue = nodes.filter(n => (inDegree[n.nodeId] || 0) === 0).map(n => n.nodeId);
    const dbWrites = [];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const node = nodeMap[currentId];

        // 1. Collect inputs passed from parents
        const upstreamContrib = pendingUpstream[currentId] ?? 0;
        const inheritedProb = pendingProb[currentId] ?? 0;

        // 2. Compute prediction
        const result = predictSingleNode(toConfig(node), toTelemetry(node), upstreamContrib, inheritedProb);
        resultMap[currentId] = result;

        console.log(
            `[Predict] ${currentId.padEnd(45)} ` +
            `prob: ${String(result.prediction.floodProbability).padStart(6)}% | ` +
            `status: ${result.status.padEnd(8)} | ` +
            `up: ${result.metrics.upstreamContribution.toFixed(2)} m³/s`
        );

        dbWrites.push(
            Node.findOneAndUpdate(
                { nodeId: currentId },
                { $set: { 
                    status: result.status, 
                    upstreamContribution: upstreamContrib, 
                    lastSeen: new Date() 
                } }
            )
        );

        // 3. Propagate to children
        (children[currentId] ?? []).forEach(childId => {
            const childNode = nodeMap[childId];
            
            // Filter only the results of parents belonging to THIS child
            const processedParents = Object.values(resultMap).filter(r => 
                (childNode.parentNodes ?? []).some(p => p.nodeId === r.nodeId)
            );
            
            // Accumulate flow and find max risk wave
            pendingUpstream[childId] = calculateUpstreamContribution(processedParents, childNode.parentNodes ?? []);
            pendingProb[childId] = calculateInheritedProbability(processedParents, childNode.parentNodes ?? []);
            
            inDegree[childId]--;
            if (inDegree[childId] === 0) queue.push(childId);
        });
    }

    await Promise.all(dbWrites);
    console.log(`[Predict] ── Cycle complete ──\n`);
}

const startPredictionService = () => {
    runPredictions().catch(console.error);
    setInterval(() => runPredictions().catch(console.error), POLL_INTERVAL_MS);
};

module.exports = { startPredictionService };