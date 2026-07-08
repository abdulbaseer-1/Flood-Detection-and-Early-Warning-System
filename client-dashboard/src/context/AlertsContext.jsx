import { createContext, useContext, useState } from 'react';

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [alerts, setAlerts] = useState([]);

  return (
    <AlertsContext.Provider value={{ selectedNodeId, setSelectedNodeId, alerts, setAlerts }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
}