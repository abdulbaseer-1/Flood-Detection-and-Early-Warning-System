import { useEffect, useMemo, useState } from 'react';
import MapViewer from './MapViewer';

const BACKEND_URL = 'http://localhost:5000';

export default function LiveDemoDashboard() {
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState('ramp');
  const [intervalMs, setIntervalMs] = useState(1500);
  const [durationMs, setDurationMs] = useState(30000);
  const [selectedNodeId, setSelectedNodeId] = useState('');

  const [nodes, setNodes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch nodes for the dropdown
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/nodes`)
      .then((r) => r.json())
      .then((payload) => {
        const arr = payload?.data ?? [];
        setNodes(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setNodes([]));
  }, []);

  const nodeOptions = useMemo(() => {
    const ids = nodes.map((n) => n.nodeId).filter(Boolean);
    return Array.from(new Set(ids));
  }, [nodes]);

  const start = async () => {
    setBusy(true);
    setMessage('Starting demo stream...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/demo/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId:     selectedNodeId || undefined,
          scenario,
          intervalMs: Number(intervalMs),
          durationMs: Number(durationMs),
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to start');

      setRunning(true);
      setMessage(payload?.message || 'Demo stream running');

      window.setTimeout(() => setRunning(false), Number(durationMs) + 250);
    } catch (e) {
      setMessage(e?.message || 'Failed to start demo stream');
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setMessage('Stopping demo stream...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/demo/stop`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.message || 'Failed to stop');

      setRunning(false);
      setMessage(payload?.message || 'Stopped');
    } catch (e) {
      setMessage(e?.message || 'Failed to stop demo stream');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      {/* CONTROL PANEL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-brand-navy">Simulation Sandbox</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure parameters and trigger a virtual flood to test the Digital Twin map.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Scenario</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              disabled={busy || running}
            >
              <option value="ramp">Gradual Ramp</option>
              <option value="spike">Flash Spike</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Target Node</label>
            <select
              className="mt-1 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              disabled={busy || running}
            >
              <option value="">Broadcast to All</option>
              {nodeOptions.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Interval (ms)</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50"
              type="number"
              value={intervalMs}
              onChange={(e) => setIntervalMs(e.target.value)}
              disabled={busy || running}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-tight">Duration (ms)</label>
            <input
              className="mt-1 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-50"
              type="number"
              value={durationMs}
              onChange={(e) => setDurationMs(e.target.value)}
              disabled={busy || running}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={start}
            className={`flex-1 md:flex-none px-8 py-3 rounded-lg text-sm font-bold transition-all ${
              running
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand-teal text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
            disabled={busy || running}
          >
            {busy ? 'Initializing...' : running ? 'Simulation Running' : 'Execute Simulation'}
          </button>

          <button
            onClick={stop}
            className={`px-8 py-3 rounded-lg text-sm font-bold border transition-all ${
              !running
                ? 'bg-transparent text-gray-300 border-gray-100 cursor-not-allowed'
                : 'bg-white text-red-600 border-red-100 hover:bg-red-50'
            }`}
            disabled={busy || !running}
          >
            Emergency Stop
          </button>

          {message && (
            <span className="text-sm font-medium text-brand-navy animate-pulse">{message}</span>
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 min-h-[500px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-md border border-gray-200 text-xs font-bold text-brand-navy shadow-sm">
          SIMULATION VIEWPORT
        </div>
        <MapViewer />
      </div>
    </div>
  );
}