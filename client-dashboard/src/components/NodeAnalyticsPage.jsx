import React from 'react';

export default function NodeAnalyticsPage() {
  const nodes = [
    { id: '0x4A1', lat: 34.1989, lng: 72.0404, status: 'Green', level: 1.45, temperature: 28.5, humidity: 72 },
    { id: '0x4A2', lat: 34.2150, lng: 72.0550, status: 'Yellow', level: 3.20, temperature: 29.2, humidity: 68 },
    { id: '0x4A3', lat: 34.1800, lng: 72.0300, status: 'Red', level: 4.85, temperature: 27.8, humidity: 75 }
  ];

  const getStatusColor = (status) => {
    if (status === 'Red') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'Yellow') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStatusDot = (status) => {
    if (status === 'Red') return 'bg-red-500';
    if (status === 'Yellow') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-grey p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Node Analytics</h1>
          <p className="text-gray-500">Real-time sensor metrics and diagnostics</p>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <div key={node.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header with status */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-brand-navy text-lg">Node {node.id}</h3>
                  <p className="text-xs text-gray-500 mt-1">Coordinates: {node.lat.toFixed(4)}, {node.lng.toFixed(4)}</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(node.status)}`}>
                  <div className={`w-2 h-2 rounded-full ${getStatusDot(node.status)}`}></div>
                  <span className="text-sm font-bold">{node.status}</span>
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
                        style={{ width: `${(node.level / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-brand-navy w-12 text-right">{node.level}m</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Temperature</span>
                  <span className="font-semibold text-brand-navy">{node.temperature}°C</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Humidity</span>
                  <span className="font-semibold text-brand-navy">{node.humidity}%</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Last Update: Just now</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Total Nodes</p>
            <p className="text-3xl font-bold text-brand-navy">3</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Active Nodes</p>
            <p className="text-3xl font-bold text-green-600">3</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Warning Nodes</p>
            <p className="text-3xl font-bold text-yellow-600">1</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-gray-500 text-sm mb-2">Critical Nodes</p>
            <p className="text-3xl font-bold text-red-600">1</p>
          </div>
        </div>
      </div>
    </main>
  );
}
