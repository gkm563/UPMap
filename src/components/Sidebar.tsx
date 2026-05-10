"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, Layers, Info, Menu, X, Mic, Navigation2, ThermometerSun, Leaf, Users } from 'lucide-react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchData, error } = useSWR(
    searchQuery.length > 1 ? `/api/search?q=${encodeURIComponent(searchQuery)}` : null, 
    fetcher
  );

  const layers = [
    { id: 'admin', name: 'प्रशासनिक सीमाएँ (Admin Boundaries)', icon: <MapIcon size={16} />, active: true },
    { id: 'traffic', name: 'रीयल-टाइम ट्रैफ़िक (Real-Time Traffic)', icon: <Navigation2 size={16} />, active: false },
    { id: 'weather', name: 'मौसम और बाढ़ (Weather & Flood)', icon: <ThermometerSun size={16} />, active: false },
    { id: 'crop', name: 'फसल बुद्धिमत्ता (Crop Intelligence)', icon: <Leaf size={16} />, active: false },
    { id: 'demo', name: 'जनसांख्यिकी (Demographics)', icon: <Users size={16} />, active: false },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (location: any) => {
    setSearchQuery(location.nameHi);
    setShowSuggestions(false);
    
    // Dispatch custom event to tell the map to fly to this location
    const event = new CustomEvent('map-fly-to', { 
      detail: { longitude: location.coordinates[0], latitude: location.coordinates[1], zoom: 12 }
    });
    window.dispatchEvent(event);
  };

  const handleLayerToggle = (layerId: string, currentStatus: boolean) => {
    const event = new CustomEvent('map-toggle-layer', { 
      detail: { layerId, active: !currentStatus }
    });
    window.dispatchEvent(event);
  };

  return (
    <AnimatePresence>
      {!isOpen ? (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => setIsOpen(true)}
          className="absolute top-4 left-4 z-20 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          <Menu size={24} />
        </motion.button>
      ) : (
        <motion.div 
          initial={{ x: -350 }}
          animate={{ x: 0 }}
          exit={{ x: -350 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute top-0 left-0 h-full w-[350px] bg-white/95 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.1)] z-20 flex flex-col border-r border-white/20"
        >
          <div className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <MapIcon size={24} className="text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-sans tracking-tight">UP Geo-Map</h1>
                <p className="text-xs text-indigo-200 font-hindi">उत्तर प्रदेश जियो इंटेलिजेंस</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
            {/* Search Box */}
            <div className="relative mb-8" ref={searchRef}>
              <div className="relative shadow-sm rounded-xl overflow-hidden border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <input 
                  type="text" 
                  placeholder="गाँव, शहर या जगह खोजें..." 
                  className="w-full p-3.5 pl-11 pr-11 text-sm font-hindi focus:outline-none text-gray-800 bg-transparent placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <button className="absolute right-3.5 top-3.5 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Mic size={18} />
                </button>
              </div>
              
              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {showSuggestions && searchQuery.length > 1 && searchData?.results && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30 font-hindi"
                  >
                    {searchData.results.length > 0 ? (
                      <ul className="max-h-60 overflow-y-auto">
                        {searchData.results.map((item: any) => (
                          <li 
                            key={item.id} 
                            onClick={() => handleLocationSelect(item)}
                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                          >
                            <div>
                              <div className="font-medium text-gray-800">{item.nameHi} <span className="text-gray-500 text-xs ml-1 font-sans">({item.nameEn})</span></div>
                              {item.parent && <div className="text-xs text-gray-500">{item.parent}</div>}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded font-sans">{item.type}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">कोई परिणाम नहीं मिला (No results found)</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Modules Layer Control */}
            <div className="mb-8">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-sans">
                Advanced Intelligence Layers
              </h2>
              <div className="space-y-1">
                {layers.map((layer) => (
                  <label key={layer.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${layer.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'} transition-colors`}>
                        {layer.icon}
                      </div>
                      <span className="text-gray-700 text-sm font-medium font-hindi group-hover:text-indigo-900 transition-colors">{layer.name}</span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked={layer.active}
                        className="sr-only peer"
                        onChange={(e) => handleLayerToggle(layer.id, !e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Context Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2 font-hindi text-sm">
                <Info size={16} className="text-indigo-600" />
                ज़ूम की जानकारी
              </h3>
              <p className="text-xs text-indigo-700/80 leading-relaxed font-hindi">
                अधिक जानकारी देखने के लिए मैप को ज़ूम इन करें। राज्य स्तर से ग्राम स्तर तक (State to Village level) की जानकारी उपलब्ध है।
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
