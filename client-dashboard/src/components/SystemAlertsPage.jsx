import React from 'react';
import SystemAlerts from './SystemAlerts';

export default function SystemAlertsPage() {
  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-grey p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">System Alerts</h1>
          <p className="text-gray-500">Real-time emergency notifications and system events</p>
        </div>

        {/* Main Alerts Panel */}
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

          {/* Alerts Container */}
          <div className="p-6">
            <SystemAlerts />
          </div>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Critical Alerts</p>
                <p className="text-lg font-semibold text-red-600">Immediate Action Required</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">1</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Warning Alerts</p>
                <p className="text-lg font-semibold text-yellow-600">Monitor Closely</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">1</span>
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
