// function to calculate the runoff from parent nodes (upstream)

/**
 * Hydrology Engine: Network Additive Logic
 * Integrates upstream volume into the local node prediction.
 * 
 * 
 * 
 * The Tweak: Pre-calculate a parentList map during Step 2.JavaScript// Inside Step 2, add:
const parentsOf = {}; 
// ... when parsing edgeKey
if (!parentsOf[v]) parentsOf[v] = [];
parentsOf[v].push(u);
This turns your Step 4B into a simple $O(1)$ lookup instead of a full loop over every edge.


 */

// Import the previous function (assuming they are in the same file or imported)
// const { predictSingleNode } = require('./engine');

/**
 * Calculates the total incoming water volume from all immediate parent nodes.
 * 
 * @param {Array<Object>} parentPredictions - The final output objects from the parents' predictions.
 * @param {Object} edgeMap - A hashmap defining the physical connection properties (lag, transmission loss) between nodes.
 * @param {string} childId - The Hex ID of the current mote being calculated.
 * @returns {number} The total incoming upstream volume in m^3/s.
 */
function calculateUpstreamContribution(parentPredictions, edgeMap, childId) {
    let totalIncomingVolume = 0;

    for (const parent of parentPredictions) {
        const parentId = parent.moteId;
        
        // Find the edge configuration for this specific Parent -> Child relationship
        // Edge ID could be formatted as "ParentID_ChildID" (e.g., "0x4A1_0x4A2")
        const edgeId = `${parentId}_${childId}`;
        const edgeConfig = edgeMap[edgeId];

        // Guardrail: If no topological connection exists, ignore it to prevent rogue data
        if (!edgeConfig) continue;

        // V_upstream is the parent's totalVolumeOut
        const vUpstream = parent.prediction.totalVolumeOut;
        
        // lag_factor: Represents transmission efficiency and timing. 
        // e.g., 0.95 means 5% of water is lost to soil absorption/evaporation between nodes.
        // If the travel time puts the water outside the current prediction window, lagFactor would be 0.
        const lagFactor = edgeConfig.lagFactor;

        const incomingFromParent = vUpstream * lagFactor;
        totalIncomingVolume += incomingFromParent;
    }

    return Number(totalIncomingVolume.toFixed(3));
}
