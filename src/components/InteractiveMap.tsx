"use client";

import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, ScaleControl, Source, Layer, LayerProps, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Mock UP Boundary
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

// Mock Districts
const districts = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.9462, 26.8467] }, properties: { name: 'लखनऊ (Lucknow)', type: 'district', pop: 4500000 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.3319, 26.4499] }, properties: { name: 'कानपुर (Kanpur)', type: 'district', pop: 4600000 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [82.9739, 25.3176] }, properties: { name: 'वाराणसी (Varanasi)', type: 'district', pop: 3600000 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [78.0081, 27.1767] }, properties: { name: 'आगरा (Agra)', type: 'district', pop: 4400000 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [81.8463, 25.4358] }, properties: { name: 'प्रयागराज (Prayagraj)', type: 'district', pop: 5900000 } }
  ]
};

// Mock Crop Intelligence (Heatmap points)
const cropPoints = {
  type: 'FeatureCollection',
  features: Array.from({ length: 100 }).map((_, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [79.0 + Math.random() * 4, 25.0 + Math.random() * 4] },
    properties: { weight: Math.random() }
  }))
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
    traffic: false,
    weather: false,
    crop: false,
    demo: false
  });

  useEffect(() => {
    const handleFlyTo = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { longitude, latitude, zoom } = customEvent.detail;
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom, duration: 2000 });
    };

    const handleToggleLayer = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { layerId, active } = customEvent.detail;
      setActiveLayers(prev => ({ ...prev, [layerId]: active }));
    };

    window.addEventListener('map-fly-to', handleFlyTo);
    window.addEventListener('map-toggle-layer', handleToggleLayer);

    return () => {
      window.removeEventListener('map-fly-to', handleFlyTo);
      window.removeEventListener('map-toggle-layer', handleToggleLayer);
    };
  }, []);

  const boundaryLineLayer: LayerProps = {
    id: 'up-boundary-line',
    type: 'line',
    source: 'up-data',
    paint: { 'line-color': '#4f46e5', 'line-width': 2, 'line-dasharray': [4, 2], 'line-opacity': 0.8 }
  };
  
  const boundaryFillLayer: LayerProps = {
    id: 'up-fill',
    type: 'fill',
    source: 'up-data',
    paint: { 'fill-color': '#4f46e5', 'fill-opacity': 0.03 }
  };

  const districtLabelsLayer: LayerProps = {
    id: 'district-labels',
    type: 'symbol',
    source: 'districts',
    minzoom: 5,
    maxzoom: 9,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 14,
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#1e1b4b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
      'text-halo-blur': 1
    }
  };

  const districtPointsLayer: LayerProps = {
    id: 'district-points',
    type: 'circle',
    source: 'districts',
    minzoom: 5,
    maxzoom: 9,
    paint: {
      'circle-radius': 6,
      'circle-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#4f46e5'
    }
  };

  // Advanced Mock Layers
  const cropHeatmapLayer: LayerProps = {
    id: 'crop-heatmap',
    type: 'heatmap',
    source: 'crops',
    maxzoom: 15,
    paint: {
      'heatmap-weight': ['get', 'weight'],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 15, 20],
      'heatmap-opacity': 0.7
    }
  };

  // Using CartoDB Voyager as a premium base map style
  const premiumMapStyle = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  return (
    <div className="w-full h-full relative font-sans">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={premiumMapStyle}
        style={{ width: '100%', height: '100%' }}
        minZoom={4}
        maxPitch={60}
      >
        <NavigationControl position="bottom-right" visualizePitch={true} />
        <ScaleControl />

        {activeLayers.admin && (
          <Source id="up-data" type="geojson" data={upBoundary as any}>
            <Layer {...boundaryFillLayer} />
            <Layer {...boundaryLineLayer} />
          </Source>
        )}

        {activeLayers.admin && (
          <Source id="districts" type="geojson" data={districts as any}>
            <Layer {...districtPointsLayer} />
            <Layer {...districtLabelsLayer} />
          </Source>
        )}

        {activeLayers.crop && (
          <Source id="crops" type="geojson" data={cropPoints as any}>
            <Layer {...cropHeatmapLayer} />
          </Source>
        )}
        
        {/* Advanced Data Indicator HUD */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 z-10 flex items-center gap-4 transition-all hover:bg-white/95">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Level</span>
              <span className="text-sm font-semibold text-gray-800 font-hindi">
                {viewState.zoom < 6 ? 'राज्य (State)' : 
                 viewState.zoom < 9 ? 'ज़िला (District)' : 
                 viewState.zoom < 12 ? 'तहसील (Tehsil)' : 
                 viewState.zoom < 15 ? 'गाँव (Village)' : 'सड़क (Street)'}
              </span>
            </div>
          </div>
          <div className="flex flex-col">
             <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Coordinates</span>
             <span className="text-sm font-mono text-gray-700">
               {viewState.latitude.toFixed(4)}, {viewState.longitude.toFixed(4)}
             </span>
          </div>
        </div>
      </Map>
    </div>
  );
}
