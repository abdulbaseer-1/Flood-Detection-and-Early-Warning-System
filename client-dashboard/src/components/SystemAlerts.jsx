export default function SystemAlerts({ alerts = [] }) {
  // Removed the unused `const { alerts: contextAlerts } = useAlerts();` line

  const getBadgeStyle = (status) => {
    if (status === 'critical') return 'bg-red-100 text-red-700 border-red-200';
    if (status === 'warning')  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-sm text-gray-500 p-4 border border-gray-100 rounded-lg bg-gray-50">
            No alerts.
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div key={idx} className="flex flex-col p-3 border border-gray-100 rounded-lg bg-gray-50 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeStyle(alert.status)}`}>
                    {String(alert.status).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">Node: {alert.nodeId}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{alert.timestamp}</span>
              </div>
              <p className="text-sm text-brand-navy mt-1">{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}