// utils/graphTraversal.js
import CanalEdge from "../models/edgeSchema.js";
import CanalNode from "../models/nodeSchema.js";

async function getDownstreamNodes(startNodeId) {
  const visited = new Set([startNodeId]);
  const queue   = [{ node_id: startNodeId, cumulative_lag: 0, path: [startNodeId] }];
  const results = [];

  while (queue.length > 0) {
    const current       = queue.shift();
    const outgoingEdges = await CanalEdge.find({ from_node_id: current.node_id }).lean();

    for (const edge of outgoingEdges) {
      if (visited.has(edge.to_node_id)) continue;
      visited.add(edge.to_node_id);

      const newLag  = current.cumulative_lag + edge.lag_time_minutes;
      const newPath = [...current.path, edge.to_node_id];
      const node    = await CanalNode.findOne({ node_id: edge.to_node_id }).lean();

      results.push({
        node_id:            edge.to_node_id,
        name:               node?.name,
        lag_minutes:        parseFloat(newLag.toFixed(1)),
        path:               newPath,
        // All fields the algorithm needs for V_pred = R × A × C
        canal_height_m:     node?.canal_height_m,
        canal_width_m:      node?.canal_width_m,
        catchment_area_m2:  node?.catchment_area_m2,
        runoff_coefficient: node?.runoff_coefficient,
        area_topology:      node?.area_topology,
        elevation_m:        node?.elevation_m,
        location:           node?.location,
      });

      queue.push({ node_id: edge.to_node_id, cumulative_lag: newLag, path: newPath });
    }
  }

  return results.sort((a, b) => a.lag_minutes - b.lag_minutes);
}

async function getFullGraph() {
  const [nodes, edges] = await Promise.all([
    CanalNode.find({ is_active: true }).lean(),
    CanalEdge.find({}).lean(),
  ]);
  return { nodes, edges };
}

async function getImmediateChildren(nodeId) {
  const edges = await CanalEdge.find({ from_node_id: nodeId }).lean();
  return Promise.all(edges.map(async edge => {
    const node = await CanalNode.findOne({ node_id: edge.to_node_id }).lean();
    return {
      ...node,
      lag_time_minutes:  edge.lag_time_minutes,
      distance_m:        edge.distance_m,
      elevation_drop_m:  edge.elevation_drop_m,
      flow_velocity_mps: edge.flow_velocity_mps,
    };
  }));
}

export { getDownstreamNodes, getFullGraph, getImmediateChildren };
