import React from 'react';

// Mock WebSocket data stream
const mockAlerts = [
  { 
    id: 1, 
    timestamp: '20:15:42', 
    level: 'CRITICAL', 
    node: '0x4A1', 
    message: 'Water level exceeded 85% capacity. Immediate overflow risk.' 
  },
  { 
    id: 2, 
    timestamp: '19:40:05', 
    level: 'WARNING', 
    node: '0x4A2', 
    message: 'Rapid upstream accumulation detected. Lag factor: 15 mins.' 
  },
  { 
    id: 3, 
    timestamp: '18:10:00', 
    level: 'INFO', 
    node: 'Global', 
    message: 'Heavy rainfall forecasted in primary catchment area.' 
  }
];

export default function SystemAlerts() {
  const getBadgeStyle = (level) => {
    if (level === 'CRITICAL') return 'bg-red-100 text-red-700 border-red-200';
    if (level === 'WARNING') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="space-y-3">
        {mockAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className="flex flex-col p-3 border border-gray-100 rounded-lg bg-gray-50 shadow-sm"
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex gap-2 items-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeStyle(alert.level)}`}>
                  {alert.level}
                </span>
                <span className="text-xs font-semibold text-gray-500">Node: {alert.node}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono">{alert.timestamp}</span>
            </div>
            <p className="text-sm text-brand-navy mt-1">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
