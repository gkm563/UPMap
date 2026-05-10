"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Map as MapIcon, Layers, Info, Menu, X, Mic, Ruler, List, Route, Edit2, SearchCode, Move, Radar, Users, Building, Landmark, CreditCard, GraduationCap, Building2, HeartPulse, ShoppingBag, Globe, Moon } from 'lucide-react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const BASEMAPS = [
  { id: 'nic-street', name: 'NIC Street', url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png' }, // Fallback to carto
  { id: 'nic-street-lite', name: 'NIC Street Lite', url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png' },
  { id: 'no-basemap', name: 'No Basemap', url: '' },
  { id: 'nic-terrain', name: 'NIC Terrain', url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg' }, // Stamen fallback
  { id: 'nic-base', name: 'NIC Base', url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png' },
  { id: 'nic-satellite', name: 'NIC Satellite Imagery', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-street', name: 'ESRI Street', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-aerial', name: 'ESRI Aerial', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { id: 'esri-topo', name: 'ESRI Topo', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}' },
  { id: 'landcover', name: 'LandCover', url: 'landcover-wms' },
  { id: 'nightlight', name: 'NightLight', url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg' }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState('esri-street');
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchData } = useSWR(
    searchQuery.length > 1 ? `/api/search?q=${encodeURIComponent(searchQuery)}` : null, 
    fetcher
  );

  const layers = [
    { id: 'bank-branch', name: 'Bank Branch (बैंक शाखा)', icon: <Landmark size={16} />, active: false },
    { id: 'bank-mitra', name: 'Bank Mitra (बैंक मित्र)', icon: <Users size={16} />, active: false },
    { id: 'atm', name: 'ATM (एटीएम)', icon: <CreditCard size={16} />, active: false },
    { id: 'school', name: 'School (विद्यालय)', icon: <GraduationCap size={16} />, active: false },
    { id: 'csc', name: 'CSC (जन सेवा केंद्र)', icon: <Building2 size={16} />, active: false },
    { id: 'health-center', name: 'Health Center (स्वास्थ्य केंद्र)', icon: <HeartPulse size={16} />, active: false },
    { id: 'pds', name: 'PDS (राशन की दुकान)', icon: <ShoppingBag size={16} />, active: false },
    { id: 'admin', name: 'Admin Boundaries', icon: <MapIcon size={16} />, active: true },
    { id: 'demography', name: 'Demography', icon: <Users size={16} />, active: false },
    { id: 'radar', name: 'Radar (Weather)', icon: <Radar size={16} />, active: false }
  ];

  const tools = [
    { id: 'distance', icon: <Ruler size={20} />, title: 'Distance' },
    { id: 'format_list_bulleted', icon: <List size={20} />, title: 'Format List' },
    { id: 'route', icon: <Route size={20} />, title: 'Route' },
    { id: 'add_road', icon: <Edit2 size={20} />, title: 'Add Road' },
    { id: 'manage_search', icon: <SearchCode size={20} />, title: 'Manage Search' },
    { id: 'move', icon: <Move size={20} />, title: 'Move' },
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
    const event = new CustomEvent('map-fly-to', { 
      detail: { longitude: location.coordinates[0], latitude: location.coordinates[1], zoom: 14 }
    });
    window.dispatchEvent(event);
  };

  const handleLayerToggle = (layerId: string, currentStatus: boolean) => {
    const event = new CustomEvent('map-toggle-layer', { 
      detail: { layerId, active: !currentStatus }
    });
    window.dispatchEvent(event);
  };

  const handleBasemapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBasemap = e.target.value;
    setActiveBasemap(newBasemap);
    const event = new CustomEvent('map-change-basemap', { detail: { basemapId: newBasemap } });
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Top Floating Tools Menu (State GIS Portal specific features) */}
      <div className="absolute top-4 right-14 z-20 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 flex p-1">
        {tools.map(tool => (
          <button key={tool.id} title={tool.title} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
            {tool.icon}
          </button>
        ))}
      </div>

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
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-0 left-0 h-full w-[360px] bg-white/95 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.1)] z-20 flex flex-col border-r border-white/20"
          >
            <div className="p-5 bg-gradient-to-br from-indigo-900 to-indigo-700 text-white flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Globe size={24} className="text-orange-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold font-sans tracking-tight">State GIS Portal</h1>
                  <p className="text-xs text-indigo-200 font-hindi">उत्तर प्रदेश जियो इंटेलिजेंस</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
              
              {/* Search Box */}
              <div className="relative mb-6" ref={searchRef}>
                <div className="relative shadow-sm rounded-xl overflow-hidden border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <input 
                    type="text" 
                    placeholder="Search locations..." 
                    className="w-full p-3.5 pl-11 pr-11 text-sm font-sans focus:outline-none text-gray-800 bg-transparent placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
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
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Basemaps Selector */}
              <div className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-sans">
                  Basemaps
                </h2>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={activeBasemap}
                  onChange={handleBasemapChange}
                >
                  {BASEMAPS.map(map => (
                    <option key={map.id} value={map.id}>{map.name}</option>
                  ))}
                </select>
              </div>

              {/* Advanced Modules Layer Control */}
              <div className="mb-8">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-sans">
                  POI & Data Layers
                </h2>
                <div className="space-y-1">
                  {layers.map((layer) => (
                    <label key={layer.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${layer.active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'} transition-colors`}>
                          {layer.icon}
                        </div>
                        <span className="text-gray-700 text-xs font-semibold font-sans group-hover:text-indigo-900 transition-colors">{layer.name}</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          defaultChecked={layer.active}
                          className="sr-only peer"
                          onChange={(e) => handleLayerToggle(layer.id, !e.target.checked)}
                        />
                        <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
