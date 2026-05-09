import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { useSelectedNode } from '../context/NodeContext';

const StartCoords = [34.011694, 71.966194];

export default function MapViewer() {
  const { selectedNodeId, setSelectedNodeId } = useSelectedNode();
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchNodes = () => {
      fetch('http://localhost:5000/api/nodes')
        .then((r) => r.json())
        .then((payload) => {
          const rawNodes = payload.data || [];
          setNodes(rawNodes.map(node => ({
            id:              node.nodeId,
            lat:             node.location.coordinates[1],
            lng:             node.location.coordinates[0],
            status:          node.status,
            label:           node.label,
            level:           node.calibratedWaterHeight || 0,
            predictedVolume: node.predictedVolume || null,
            alertMessage:    node.alertMessage || null,
          })));
        })
        .catch((err) => {
          console.error('Fetch error:', err);
          setNodes([]);
        });
    };

    fetchNodes();                               // run immediately on mount
    const id = setInterval(fetchNodes, 3000);   // then every 3 seconds
    return () => clearInterval(id);             // cleanup on unmount
  }, []);

  const getColor = (status) => {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning')  return '#eab308';
    return '#0d9488';
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={StartCoords}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CartoDB'
        />

        {nodes.map((node) => (
        <CircleMarker
          key={node.id}
          center={[node.lat, node.lng]}
          radius={selectedNodeId === node.id ? 16 : 12}  // bigger when selected
          pathOptions={{
            color:       getColor(node.status),
            fillColor:   getColor(node.status),
            fillOpacity: 0.7,
            weight:      selectedNodeId === node.id ? 4 : 2,  // thicker border
          }}
          eventHandlers={{
            click: () => setSelectedNodeId(node.id),   // ← select on click
          }}
        >
            <Popup>
              <div className="font-sans">
                <strong className="text-brand-navy">Node ID: {node.id}</strong><br/>
                <span className="text-gray-600">
                  Water Level: {Number(node.level).toFixed(2)}m
                </span><br/>
                <span className="font-bold" style={{ color: getColor(node.status) }}>
                  Status: {node.status}
                </span>
                {node.predictedVolume && (
                  <>
                    <br/>
                    <span className="text-gray-600">
                      Predicted Volume: {node.predictedVolume.toFixed(1)} m³
                    </span>
                  </>
                )}
                {node.alertMessage && (
                  <>
                    <br/>
                    <span className="text-red-500 text-xs">{node.alertMessage}</span>
                  </>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}