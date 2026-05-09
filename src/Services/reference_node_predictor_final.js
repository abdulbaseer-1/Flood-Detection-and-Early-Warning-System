/**
 * Main prediction function for a network-connected node.
 * Fuses local runoff with upstream contributions to evaluate systemic flood risk.
 * 
 * @param {Object} moteConfig - Static configuration for the specific mote.
 * @param {Object} telemetry - Dynamic data from sensors and weather APIs.
 * @param {Array<Object>} parentPredictions - Array of calculated predictions from upstream nodes.
 * @param {Object} edgeMap - Hashmap of connection properties between nodes.
 * @returns {Object} Standardized network prediction output.
 */
function predictNetworkNode(moteConfig, telemetry, parentPredictions, edgeMap) {
    // 1. Calculate the isolated local prediction first
    const localPrediction = predictSingleNode(moteConfig, telemetry);

    // 2. Calculate the upstream additive volume
    let upstreamVolume = 0;
    if (parentPredictions && parentPredictions.length > 0) {
        upstreamVolume = calculateUpstreamContribution(parentPredictions, edgeMap, moteConfig.moteId);
    }

    // 3. Fuse the volumes (The Core Equation)
    // V_pred = (R * A * C) + Sum(V_upstream * lag_factor)
    const combinedVolumeOut = localPrediction.prediction.totalVolumeOut + upstreamVolume;

    // 4. Recalculate Flood Probability based on combined volume
    let networkFloodProbability = (combinedVolumeOut / moteConfig.maxRatedFlow) * 100;
    
    // Cap at 100% for standard UI rendering
    if (networkFloodProbability > 100) networkFloodProbability = 100;

    // 5. Recalculate Risk Level
    let networkRiskLevel = "Green";
    if (networkFloodProbability >= 85) {
        networkRiskLevel = "Red";
    } else if (networkFloodProbability >= 50) {
        networkRiskLevel = "Yellow";
    }

    // 6. Construct the fused Output Object
    // We retain the original local metrics so the GIS developer can show *why* it's flooding
    // (e.g., Local rain vs. Upstream surge)
    return {
        moteId: localPrediction.moteId,
        coordinates: localPrediction.coordinates,
        elevation: localPrediction.elevation,
        metrics: {
            ...localPrediction.metrics,
            upstreamIncoming: upstreamVolume // Newly added metric for transparency
        },
        prediction: {
            totalVolumeOut: Number(combinedVolumeOut.toFixed(3)),
            localVolumeContribution: localPrediction.prediction.totalVolumeOut,
            floodProbability: Number(networkFloodProbability.toFixed(1)),
            riskLevel: networkRiskLevel
        }
    };
}

module.exports = { predictNetworkNode, calculateUpstreamContribution };