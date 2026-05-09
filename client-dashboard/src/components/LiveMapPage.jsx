
import MapViewer from './MapViewer';
import NodeChart from './NodeChart';
import SystemAlerts from './SystemAlerts';
import { useSelectedNode } from '../context/NodeContext';

export default function LiveMapPage() {
  const { selectedNodeId } = useSelectedNode();
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-grey p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* Map Container */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[500px]">
          <div className="p-4 border-b border-gray-100 font-medium text-brand-navy flex justify-between">
            <span>Digital Twin Topology</span>
            <span className="text-xs text-gray-400 font-normal">Live Feed Active</span>
          </div>
          <div className="flex-1 bg-gray-50 relative">
            <MapViewer />
          </div>
        </div>

        {/* Charts Container */}
        <div className="col-span-1 flex flex-col gap-8">
          <div className="bg-white h-1/2 rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">

            <div className="p-4 border-b border-gray-100 font-medium text-brand-navy flex justify-between items-center">
              <span>{selectedNodeId ? `${selectedNodeId} Metrics` : 'Select a node'}</span>
            </div>
            <div className="flex-1 bg-white relative">
              <NodeChart />
            </div>
          </div>
          <div className="bg-white h-1/2 rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-medium text-brand-navy flex justify-between items-center">
              <span>Active Alerts</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
            <div className="flex-1 bg-white relative overflow-hidden">
              <SystemAlerts />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
