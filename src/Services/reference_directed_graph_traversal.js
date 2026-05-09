// This function synchronizes the prediction of nodes (time based) so parent nodes are evaluted before child nodes
// This is because the child node requires the parents data for accurate predictions.

/**
 * Hydrology Engine: Graph Traversal Orchestrator
 * Ensures parent nodes are evaluated before children to maintain data integrity.
 */

/*
NOTE: add time series delay based on distance od two otes, e.g water from mote A to B (5km)
will take 20 mins to reach
 */

const { predictNetworkNode } = require('./engine');

/**
 * Traverses the graph and calculates predictions for all nodes in the correct order.
 * 
 * @param {Object} moteHashMap - The Hex-mapped Hashmap of all mote configurations.
 * @param {Object} telemetryMap - The latest sensor/weather data for all motes.
 * @param {Object} edgeMap - The connectivity properties (lag, loss) between nodes.
 * @returns {Object} A map of final calculated predictions for the entire network.
 */
function processNetworkPredictions(moteHashMap, telemetryMap, edgeMap) {
    const finalResults = {}; // Stores result of each node: { "0x4A1": {predictionObj} }
    
    // 1. Identify "In-Degrees" (How many parents each node has)
    const inDegree = {};
    const adjList = {}; // Adjacency list for child lookup
    const queue = [];

    // Initialize tracking
    Object.keys(moteHashMap).forEach(id => {
        inDegree[id] = 0;
        adjList[id] = [];
    });

    // 2. Build the graph relationships from the edgeMap
    // edgeMap keys are "ParentID_ChildID"
    Object.keys(edgeMap).forEach(edgeKey => {
        const [u, v] = edgeKey.split('_');
        if (adjList[u]) {
            adjList[u].push(v);
            inDegree[v]++;
        }
    });

    // 3. Find "Root" Nodes (Nodes with 0 parents) and add to processing queue
    Object.keys(inDegree).forEach(id => {
        if (inDegree[id] === 0) {
            queue.push(id);
        }
    });

    // 4. Process the Queue (Kahn's Algorithm / Topological Order)
    while (queue.length > 0) {
        const currentId = queue.shift();
        
        // A. Get current mote's config and telemetry
        const config = moteHashMap[currentId];
        const telemetry = telemetryMap[currentId];

        // B. Gather predictions of all its parents (if any)
        // We find parents by looking for any edge ending in currentId
        const parentResults = [];
        Object.keys(edgeMap).forEach(edgeKey => {
            const [u, v] = edgeKey.split('_');
            if (v === currentId && finalResults[u]) {
                parentResults.push(finalResults[u]);
            }
        });

        // C. Execute the Network Prediction
        // This function was created in the previous step
        const prediction = predictNetworkNode(config, telemetry, parentResults, edgeMap);
        
        // D. Save the result
        finalResults[currentId] = prediction;

        // E. Update children: Decrease their in-degree
        adjList[currentId].forEach(neighbor => {
            inDegree[neighbor]--;
            // If all parents of this neighbor are processed, add neighbor to queue
            if (inDegree[neighbor] === 0) {
                queue.push(neighbor);
            }
        });
    }

    return finalResults;
}

module.exports = { processNetworkPredictions };