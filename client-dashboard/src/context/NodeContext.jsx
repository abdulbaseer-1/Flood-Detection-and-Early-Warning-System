import { createContext, useContext, useState } from 'react';

const NodeContext = createContext(null);

export function NodeProvider({ children }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  return (
    <NodeContext.Provider value={{ selectedNodeId, setSelectedNodeId }}>
      {children}
    </NodeContext.Provider>
  );
}

export function useSelectedNode() {
  return useContext(NodeContext);
}