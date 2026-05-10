"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { NavigationControl, ScaleControl, Source, Layer, LayerProps, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BASEMAPS } from './Sidebar';

// POI Mock Data Generators (representing backend data for Bank, ATM, School, etc.)
const generatePOIs = (count: number, type: string) => ({
  type: 'FeatureCollection',
  features: Array.from({ length: count }).map((_, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [79.0 + Math.random() * 4, 25.0 + Math.random() * 4] },
    properties: { id: i, type, name: `${type} ${i}` }
  }))
});

const mockPOIs = {
  'bank-branch': generatePOIs(150, 'Bank Branch'),
  'bank-mitra': generatePOIs(300, 'Bank Mitra'),
  'atm': generatePOIs(200, 'ATM'),
  'school': generatePOIs(400, 'School'),
  'csc': generatePOIs(100, 'CSC'),
  'health-center': generatePOIs(120, 'Health Center'),
  'pds': generatePOIs(250, 'PDS')
};

// Accurate Admin Boundary (Simplified)
const upBoundary = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[77.0, 27.0], [78.0, 30.0], [80.0, 29.0], [84.0, 27.5], [84.5, 25.5], [83.0, 24.0], [81.0, 24.5], [78.5, 24.0], [77.0, 27.0]]]
    },
    properties: { name: 'उत्तर प्रदेश (Uttar Pradesh)' }
  }]
};

export default function InteractiveMap() {
  const mapRef = useRef<MapRef>(null);
  
  const [viewState, setViewState] = useState({
    longitude: 80.9462, 
    latitude: 26.8467,
    zoom: 6,
    pitch: 0,
    bearing: 0
  });

  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    admin: true,
  });

  const [activeBasemapId, setActiveBasemapId] = useState('esri-street');
  const [weatherTime, setWeatherTime] = useState<number | null>(null);

  useEffect(() => {
    if (activeLayers.radar && !weatherTime) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
          if (data.radar?.past?.length > 0) {
            setWeatherTime(data.radar.past[data.radar.past.length - 1].time);
          }
        })
        .catch(console.error);
    }
  }, [activeLayers.radar, weatherTime]);

  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const { longitude, latitude, zoom } = (e as CustomEvent).detail;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 2000 });
    };

    const handleToggleLayer = (e: Event) => {
      const { layerId, active } = (e as CustomEvent).detail;
      setActiveLayers(prev => ({ ...prev, [layerId]: active }));
    };

    const handleBasemapChange = (e: Event) => {
      setActiveBasemapId((e as CustomEvent).detail.basemapId);
    };

    window.addEventListener('map-fly-to', handleFlyTo);
    window.addEventListener('map-toggle-layer', handleToggleLayer);
    window.addEventListener('map-change-basemap', handleBasemapChange);

    return () => {
      window.removeEventListener('map-fly-to', handleFlyTo);
      window.removeEventListener('map-toggle-layer', handleToggleLayer);
      window.removeEventListener('map-change-basemap', handleBasemapChange);
    };
  }, []);

  // Construct Map Style JSON based on selected basemap
  const mapStyle = useMemo(() => {
    if (activeBasemapId === 'no-basemap') {
      return { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f3f4f6' } }] };
    }
    
    const basemapUrl = BASEMAPS.find(b => b.id === activeBasemapId)?.url;
    
    // Some are standard Mapbox Styles
    if (activeBasemapId === 'nic-street-lite' || activeBasemapId === 'nic-base' || activeBasemapId === 'nic-street') {
        // We fallback to carto for these names as actual NIC URLs are private
        // If it's a direct style.json link, we can return the URL, but carto URLs are raster tiles.
    }

    // Default: Raster Tile Style
    return {
      version: 8,
      sources: {
        'basemap-raster': {
          type: 'raster',
          tiles: [basemapUrl || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'basemap-layer',
          type: 'raster',
          source: 'basemap-raster',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
  }, [activeBasemapId]);

  // Layer Paint Properties
  const getPoiPaint = (color: string) => ({
    'circle-radius': 5,
    'circle-color': color,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#ffffff'
  });

  return (
    <div className="w-full h-full relative font-sans">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle as any}
        style={{ width: '100%', height: '100%' }}
        minZoom={5}
        maxPitch={60}
      >
        <NavigationControl position="bottom-right" visualizePitch={true} />
        <ScaleControl />

        {activeLayers.admin && (
          <Source id="up-data" type="geojson" data={upBoundary as any}>
            <Layer id="up-fill" type="fill" paint={{ 'fill-color': '#4f46e5', 'fill-opacity': 0.05 }} />
            <Layer id="up-line" type="line" paint={{ 'line-color': '#1e1b4b', 'line-width': 2, 'line-dasharray': [4, 2] }} />
          </Source>
        )}

        {/* POI Layers */}
        {activeLayers['bank-branch'] && (
          <Source id="bank-branch" type="geojson" data={mockPOIs['bank-branch'] as any}>
            <Layer id="layer-bank-branch" type="circle" paint={getPoiPaint('#16a34a')} />
          </Source>
        )}
        {activeLayers['bank-mitra'] && (
          <Source id="bank-mitra" type="geojson" data={mockPOIs['bank-mitra'] as any}>
            <Layer id="layer-bank-mitra" type="circle" paint={getPoiPaint('#059669')} />
          </Source>
        )}
        {activeLayers['atm'] && (
          <Source id="atm" type="geojson" data={mockPOIs['atm'] as any}>
            <Layer id="layer-atm" type="circle" paint={getPoiPaint('#d97706')} />
          </Source>
        )}
        {activeLayers['school'] && (
          <Source id="school" type="geojson" data={mockPOIs['school'] as any}>
            <Layer id="layer-school" type="circle" paint={getPoiPaint('#2563eb')} />
          </Source>
        )}
        {activeLayers['csc'] && (
          <Source id="csc" type="geojson" data={mockPOIs['csc'] as any}>
            <Layer id="layer-csc" type="circle" paint={getPoiPaint('#7c3aed')} />
          </Source>
        )}
        {activeLayers['health-center'] && (
          <Source id="health-center" type="geojson" data={mockPOIs['health-center'] as any}>
            <Layer id="layer-health-center" type="circle" paint={getPoiPaint('#e11d48')} />
          </Source>
        )}
        {activeLayers['pds'] && (
          <Source id="pds" type="geojson" data={mockPOIs['pds'] as any}>
            <Layer id="layer-pds" type="circle" paint={getPoiPaint('#ea580c')} />
          </Source>
        )}

        {/* Radar Layer */}
        {activeLayers.radar && weatherTime && (
          <Source id="radar-data" type="raster" tiles={[`https://tilecache.rainviewer.com/v2/radar/${weatherTime}/256/{z}/{x}/{y}/2/1_1.png`]} tileSize={256}>
            <Layer id="layer-radar" type="raster" paint={{ 'raster-opacity': 0.6 }} />
          </Source>
        )}
        
        {/* Advanced Data Indicator HUD */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-white/50 z-10 flex items-center gap-5 transition-all">
          <div className="flex flex-col leading-tight pr-5 border-r border-gray-200">
             <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Basemap</span>
             <span className="text-sm font-semibold text-indigo-700">{BASEMAPS.find(b => b.id === activeBasemapId)?.name}</span>
          </div>
          <div className="flex flex-col leading-tight">
             <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Coordinates</span>
             <span className="text-sm font-mono font-medium text-gray-700">
               {viewState.latitude.toFixed(4)}, {viewState.longitude.toFixed(4)}
             </span>
          </div>
        </div>
      </Map>
    </div>
  );
}
