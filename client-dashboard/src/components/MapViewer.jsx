import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // This is crucial so the map doesn't look broken!

// Center the map roughly over Mardan, KP
const mardanCoords = [34.1989, 72.0404];

// Mock data simulating what the backend (Module 4) will eventually send us
const mockNodes = [
  { id: '0x4A1', lat: 34.1989, lng: 72.0404, status: 'Green', level: 1.45 },
  { id: '0x4A2', lat: 34.2150, lng: 72.0550, status: 'Yellow', level: 3.20 },
  { id: '0x4A3', lat: 34.1800, lng: 72.0300, status: 'Red', level: 4.85 } // Danger zone!
];

export default function MapViewer() {
  // Helper function to pick colors based on risk level
  const getColor = (status) => {
    if (status === 'Red') return '#ef4444';    // Tailwind Red-500
    if (status === 'Yellow') return '#eab308'; // Tailwind Yellow-500
    return '#0d9488';                          // Our Brand Teal for Green/Safe
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={mardanCoords} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        {/* We use a clean, light base map so our colored nodes pop out clearly */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CartoDB'
        />
        
        {/* Loop through our data and draw the sensor nodes */}
        {mockNodes.map(node => (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={12}
            pathOptions={{
              color: getColor(node.status),
              fillColor: getColor(node.status),
              fillOpacity: 0.7,
              weight: 2
            }}
          >
            {/* The popup that appears when a user clicks a node */}
            <Popup>
              <div className="font-sans">
                <strong className="text-brand-navy">Node ID: {node.id}</strong><br/>
                <span className="text-gray-600">Water Level: {node.level}m</span><br/>
                <span className="font-bold" style={{ color: getColor(node.status) }}>
                  Status: {node.status}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
