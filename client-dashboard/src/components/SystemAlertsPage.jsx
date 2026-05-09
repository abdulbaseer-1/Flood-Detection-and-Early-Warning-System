import { useEffect, useState } from 'react';
import SystemAlerts from './SystemAlerts';

const BACKEND_URL = 'http://localhost:5000';

export default function SystemAlertsPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch(`${BACKEND_URL}/api/nodes`)
        .then((r) => r.json())
        .then((payload) => {
          const nodes = payload?.data ?? [];
          const active = nodes
            .filter((n) => n.status && n.status !== 'normal')
            .map((n) => ({
              nodeId:    n.nodeId,
              status:    n.status,
              message:   `Node ${n.nodeId} is in ${n.status} state`,
              timestamp: n.lastSeen ? new Date(n.lastSeen).toLocaleTimeString() : '',
            }));
          setAlerts(active);
        })
        .catch(() => setAlerts([]));
    };

    fetchAlerts();
    const id = setInterval(fetchAlerts, 3000);
    return () => clearInterval(id);
  }, []);

  // Derived stats from live data
  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const warningCount  = alerts.filter(a => a.status === 'warning').length;
  const otherCount    = alerts.filter(a => a.status !== 'critical' && a.status !== 'warning').length;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-grey p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">System Alerts</h1>
          <p className="text-gray-500">Real-time emergency notifications and system events</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-white to-gray-50">
            <div>
              <h2 className="text-2xl font-semibold text-brand-navy">Active Alerts</h2>
              <p className="text-sm text-gray-500 mt-1">All system notifications sorted by severity</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="font-semibold text-red-700">LIVE</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <SystemAlerts alerts={alerts} />  {/* ← pass alerts as prop */}
          </div>
        </div>

        {/* Alert Statistics — derived from live data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Critical Alerts</p>
                <p className="text-lg font-semibold text-red-600">High Risk</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">{warningCount}</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Warning Alerts</p>
                <p className="text-lg font-semibold text-yellow-600">Medium Risk</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{otherCount}</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Info Alerts</p>
                <p className="text-lg font-semibold text-blue-600">System Updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}