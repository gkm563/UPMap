"use client";

import { useState } from 'react';
import { Search, Map as MapIcon, Layers, Info, Menu, X, Mic } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const layers = [
    { id: 'admin', name: 'प्रशासनिक सीमाएँ (Admin Boundaries)', active: true },
    { id: 'roads', name: 'सड़कें (Roads)', active: true },
    { id: 'infra', name: 'बुनियादी ढांचा (Infrastructure)', active: false },
    { id: 'agri', name: 'कृषि और भूमि (Agriculture & Land)', active: false },
    { id: 'demo', name: 'जनसांख्यिकी (Demographics)', active: false },
  ];

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 left-4 z-10 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-100 transition-colors"
      >
        <Menu size={24} />
      </button>
    );
  }

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl z-10 flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200">
      <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <MapIcon size={24} />
          <h1 className="text-xl font-bold font-sans tracking-wide">UP Geo-Map</h1>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-orange-200 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="relative mb-6 shadow-sm">
          <input 
            type="text" 
            placeholder="गांव, शहर या जगह खोजें..." 
            className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 bg-gray-50 placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <button className="absolute right-3 top-3.5 text-gray-400 hover:text-orange-500 transition-colors">
            <Mic size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers size={16} />
            डेटा लेयर्स (Data Layers)
          </h2>
          <div className="space-y-3">
            {layers.map((layer) => (
              <label key={layer.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    defaultChecked={layer.active}
                    className="w-5 h-5 border-2 border-gray-300 rounded text-orange-500 focus:ring-orange-500 focus:ring-offset-0 transition-all cursor-pointer peer"
                  />
                </div>
                <span className="text-gray-700 text-sm font-medium group-hover:text-orange-600 transition-colors">{layer.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-2">
            <Info size={18} />
            ज़ूम की जानकारी
          </h3>
          <p className="text-xs text-orange-700 leading-relaxed">
            अधिक जानकारी देखने के लिए मैप को ज़ूम इन करें। राज्य स्तर से ग्राम स्तर तक (State to Village level) की जानकारी उपलब्ध है।
          </p>
        </div>
      </div>
    </div>
  );
}
