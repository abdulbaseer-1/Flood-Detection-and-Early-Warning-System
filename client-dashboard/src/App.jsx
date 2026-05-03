import React, { useState } from 'react'
import LiveMapPage from './components/LiveMapPage'
import NodeAnalyticsPage from './components/NodeAnalyticsPage'
import SystemAlertsPage from './components/SystemAlertsPage'

function App() {
  const [activeMenu, setActiveMenu] = useState('map')

  const menuItems = [
    { id: 'map', label: 'Live Map' },
    { id: 'analytics', label: 'Node Analytics' },
    { id: 'alerts', label: 'System Alerts' }
  ]

  const renderPage = () => {
    switch(activeMenu) {
      case 'map':
        return <LiveMapPage />
      case 'analytics':
        return <NodeAnalyticsPage />
      case 'alerts':
        return <SystemAlertsPage />
      default:
        return <LiveMapPage />
    }
  }
  return (
    <div className="flex h-screen bg-brand-grey font-sans">
      
      {/* 1. Sidebar Navigation */}
      <div className="w-64 bg-brand-navy text-white flex flex-col shadow-xl z-20">
        <div className="p-6 text-2xl font-bold border-b border-gray-800 text-brand-teal tracking-wider">
          AFPEWS
        </div>
        <div className="p-4 flex-1">
          <p className="text-gray-500 text-xs uppercase font-semibold mb-4 tracking-wider">Menu</p>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li 
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`p-3 rounded border-l-4 transition-all cursor-pointer ${
                  activeMenu === item.id 
                    ? 'bg-brand-dark border-l-4 border-brand-teal text-white' 
                    : 'border-l-4 border-transparent text-gray-300 hover:bg-brand-dark'
                }`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white shadow-sm p-4 px-8 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-semibold text-brand-navy">Network Overview</h2>
            <p className="text-sm text-gray-500">Mardan Drainage Canal System</p>
          </div>
          <div className="bg-brand-teal/10 text-brand-teal border border-brand-teal/20 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse"></div>
            System Normal
          </div>
        </header>

        {/* Dashboard Grid */}
        {renderPage()}
      </div>
    </div>
  )
}

export default App
