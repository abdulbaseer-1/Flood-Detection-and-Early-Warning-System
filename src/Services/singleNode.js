'use strict';

const MM_TO_METERS = 0.001;
const SECONDS_IN_HOUR = 3600;

function calcLocalRunoff(catchmentArea, runoffCoefficient, rainfall_mmhr) {
    const rainfall_mhr = rainfall_mmhr * MM_TO_METERS;
    return (runoffCoefficient * rainfall_mhr * catchmentArea) / SECONDS_IN_HOUR;
}

function toStatus(probability) {
    if (probability >= 85) return 'critical';
    if (probability >= 50) return 'warning';
    return 'normal';
}

function calcFloodProbability(waterHeight, canalDepth, totalVolume, maxRatedFlow, inheritedProb = 0) {
    // 1. Local Reality
    const currentFillRatio = waterHeight / canalDepth;
    const flowCapacityRatio = totalVolume / maxRatedFlow;
    const localProb = Math.max(currentFillRatio, flowCapacityRatio) * 100;

    // 2. Propagated Reality (Max of local sensors vs incoming parent risk)
    const finalProbability = Math.max(localProb, inheritedProb);

    return Math.min(Number(finalProbability.toFixed(2)), 100); 
}

function predictSingleNode(config, telemetry, upstreamContribution = 0, inheritedProb = 0) {
    const localRunoff = calcLocalRunoff(config.catchmentArea, config.runoffCoefficient, telemetry.rainfall_mmhr);
    const baseVolume = (telemetry.flowRate || 0) + localRunoff + upstreamContribution;

    // Surge Factor: Water moves faster/higher when the node is already full
    const currentFillRatio = telemetry.waterHeight / config.canalDepth;
    const effectiveOutflow = baseVolume * Math.max(1, currentFillRatio);

    const floodProbability = calcFloodProbability(
        telemetry.waterHeight,
        config.canalDepth,
        effectiveOutflow,
        config.maxRatedFlow,
        inheritedProb
    );

    return {
        nodeId: config.nodeId,
        status: toStatus(floodProbability),
        metrics: {
            waterHeight: telemetry.waterHeight,
            sensorFlow: Number(telemetry.flowRate.toFixed(4)),
            localRunoff: Number(localRunoff.toFixed(4)),
            upstreamContribution: Number(upstreamContribution.toFixed(4)),
            combinedFlow: Number(effectiveOutflow.toFixed(4)),
        },
        prediction: {
            floodProbability,
            fillRatio: Number(currentFillRatio.toFixed(4)),
        },
    };
}

module.exports = { predictSingleNode };