import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock 24-hour time-series data (What the backend API will send us)
const data = [
  { time: '00:00', level: 1.2 },
  { time: '04:00', level: 1.3 },
  { time: '08:00', level: 1.2 },
  { time: '12:00', level: 1.5 },
  { time: '16:00', level: 2.8 }, // Rain starts!
  { time: '20:00', level: 4.1 }, // Peak surge
  { time: '24:00', level: 3.5 }, // Starting to drain
];

export default function NodeChart() {
  return (
    <div className="w-full h-full p-4">
      {/* ResponsiveContainer ensures the chart stretches to fit the box perfectly */}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* This creates a cool fading water effect under the line */}
            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            axisLine={false} 
            tickLine={false} 
          />
          {/* Tooltip shows the exact number when you hover over the chart */}
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
