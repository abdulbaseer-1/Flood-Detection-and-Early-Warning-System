'use strict';

/**
 * Models the decay of a flood wave over distance (soil absorption, bank overflow).
 * Constant 15000 (15km) represents the reach of the Kabul River floodplain.
 */
function deriveLagFactor(distance_m) {
    if (!distance_m || distance_m <= 0) return 0.95;
    return Number(Math.exp(-distance_m / 15000).toFixed(4));
}

/**
 * Sums combined flow from all parents to provide the upstream input for a child.
 */
function calculateUpstreamContribution(parentResults, parentNodeDefs) {
    let total = 0;
    for (const parentResult of parentResults) {
        const edgeDef = parentNodeDefs.find(p => p.nodeId === parentResult.nodeId);
        const lagFactor = edgeDef?.distance_m ? deriveLagFactor(edgeDef.distance_m) : 0.95;
        total += parentResult.metrics.combinedFlow * lagFactor;
    }
    return Number(total.toFixed(4));
}

/**
 * Inherits the highest probability from parents to predict future risk.
 */
function calculateInheritedProbability(parentResults, parentNodeDefs) {
    let maxInheritedProb = 0;
    for (const parentResult of parentResults) {
        const edgeDef = parentNodeDefs.find(p => p.nodeId === parentResult.nodeId);
        const lagFactor = edgeDef?.distance_m ? deriveLagFactor(edgeDef.distance_m) : 0.95;
        
        // Propagate parent risk (e.g., 176%) downstream with distance decay
        const propagatedValue = parentResult.prediction.floodProbability * lagFactor;
        
        if (propagatedValue > maxInheritedProb) {
            maxInheritedProb = propagatedValue;
        }
    }
    return Number(maxInheritedProb.toFixed(2));
}

module.exports = { 
    calculateUpstreamContribution, 
    calculateInheritedProbability, 
    deriveLagFactor 
};