import { useEffect, useState } from 'react';

const BACKEND_URL = 'http://localhost:5000';

export default function NodeAnalyticsPage() {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchNodes = () => {
      fetch(`${BACKEND_URL}/api/nodes`)
        .then((r) => r.json())
        .then((payload) => setNodes(payload.data ?? []))
        .catch(() => setNodes([]));
    };

    fetchNodes();
    const id = setInterval(fetchNodes, 3000);
    return () => clearInterval(id);
  }, []);

  const getStatusColor = (status) => {
    if (status === 'critical')          return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'warning')           return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'sensor_malfunction' || status === 'offline')
                                        return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStatusDot = (status) => {
    if (status === 'critical')          return 'bg-red-500';
    if (status === 'warning')           return 'bg-yellow-500';
    if (status === 'sensor_malfunction' || status === 'offline')
                                        return 'bg-gray-400';
    return 'bg-green-500';
  };

  // Derived stats from live data
  const totalNodes    = nodes.length;
  const activeNodes   = nodes.filter(n => n.status === 'normal').length;
  const warningNodes  = nodes.filter(n => n.status === 'warning').length;
  const criticalNodes = nodes.filter(n => n.status === 'critical').length;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-grey p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Node Analytics</h1>
          <p className="text-gray-500">Real-time sensor metrics and diagnostics</p>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => {
            const lat = node.location?.coordinates?.[1] ?? 0;
            const lng = node.location?.coordinates?.[0] ?? 0;
            

            return (
              <div key={node.nodeId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-brand-navy text-lg">{node.label || node.nodeId}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(node.status)}`}>
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(node.status)}`}></div>
                    <span className="text-sm font-bold capitalize">{node.status}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Water Level</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-teal h-2 rounded-full"
                          style={{ width: `${Math.min((node.calibratedWaterHeight / node.canal_depth_m) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-brand-navy w-16 text-right">
                        {node.calibratedWaterHeight?.toFixed(2) ?? '0.00'}m
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Flow Rate</span>
                    <span className="font-semibold text-brand-navy">
                      {node.flowRate?.toFixed(3) ?? '0.000'} m³/s
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Rainfall</span>
                    <span className="font-semibold text-brand-navy">
                      {node.rainfall?.toFixed(1) ?? '0.0'} mm/hr
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Last Update: {node.lastSeen ? new Date(node.lastSeen).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Total Nodes</p>
            <p className="text-3xl font-bold text-brand-navy">{totalNodes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Normal Nodes</p>
            <p className="text-3xl font-bold text-green-600">{activeNodes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Warning Nodes</p>
            <p className="text-3xl font-bold text-yellow-600">{warningNodes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Critical Nodes</p>
            <p className="text-3xl font-bold text-red-600">{criticalNodes}</p>
          </div>
        </div>
      </div>
    </main>
  );
}