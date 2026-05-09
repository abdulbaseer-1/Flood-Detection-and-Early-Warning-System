import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSelectedNode } from '../context/NodeContext';

const BACKEND_URL = 'http://localhost:5000';

export default function NodeChart({hours = 24 }) {
  const { selectedNodeId } = useSelectedNode(); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedNodeId) return;  

    const fetchHistory = () => {
      fetch(`${BACKEND_URL}/api/nodes/${selectedNodeId}/history?hours=${hours}&limit=500`)
        .then((r) => r.json())
        .then((payload) => {
          const records = payload.data ?? [];

          // Records come back newest-first — reverse for chronological chart
          const chartData = records
            .reverse()
            .map((r) => ({
              time:  new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              level: r.water_level_m ?? 0,
              flow:  r.flow_rate_m3s ?? 0,
              rain:  r.rainfall_mmhr ?? 0,
              temp:  r.temperature_k ? (r.temperature_k - 273.15).toFixed(1) : 0,
            }));

          setData(chartData);
          setLoading(false);
        })
        .catch(() => {
          setData([]);
          setLoading(false);
        });
    };

    fetchHistory();
    const id = setInterval(fetchHistory, 3000);
    return () => clearInterval(id);
  }, [selectedNodeId, hours]);

  if (!selectedNodeId) return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      Click a node on the map to view its chart
    </div>
  );

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      Loading...
    </div>
  );

  if (data.length === 0) return (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      No telemetry data for this node yet
    </div>
  );

  return (
    <div className="w-full h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            unit="m"
          />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`${value}m`, 'Water Level']}
          />
          <Area
            type="monotone"
            dataKey="level"
            stroke="#0d9488"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLevel)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}