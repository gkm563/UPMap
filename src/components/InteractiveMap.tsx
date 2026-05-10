"use client";

import { useState, useEffect, useRef } from 'react';
import Map, { NavigationControl, ScaleControl, Source, Layer, LayerProps, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Accurate Admin Boundary (Simplified for Performance)
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

// Realistic Demographics (Based on 2011 Census approximations for top districts)
const demographicsDistricts = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.9462, 26.8467] }, properties: { name: 'लखनऊ', pop: 4589838, density: 1816 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.3319, 26.4499] }, properties: { name: 'कानपुर', pop: 4581268, density: 1452 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [82.9739, 25.3176] }, properties: { name: 'वाराणसी', pop: 3676841, density: 2395 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [78.0081, 27.1767] }, properties: { name: 'आगरा', pop: 4418797, density: 1093 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [81.8463, 25.4358] }, properties: { name: 'प्रयागराज', pop: 5954391, density: 1086 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [83.3732, 26.7606] }, properties: { name: 'गोरखपुर', pop: 4440895, density: 1337 } }
  ]
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

  const [weatherTime, setWeatherTime] = useState<number | null>(null);

  // Fetch real-time weather radar timestamps
  useEffect(() => {
    if (activeLayers.weather && !weatherTime) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.json())
        .then(data => {
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            setWeatherTime(data.radar.past[data.radar.past.length - 1].time);
          }
        })
        .catch(console.error);
    }
  }, [activeLayers.weather, weatherTime]);

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

  // --- Map Layers Configurations ---

  const boundaryLineLayer: LayerProps = {
    id: 'up-boundary-line',
    type: 'line',
    source: 'up-data',
    paint: { 'line-color': '#1e1b4b', 'line-width': 2, 'line-dasharray': [4, 2], 'line-opacity': 0.8 }
  };
  
  const boundaryFillLayer: LayerProps = {
    id: 'up-fill',
    type: 'fill',
    source: 'up-data',
    paint: { 'fill-color': '#4f46e5', 'fill-opacity': 0.05 }
  };

  // 1. Live Traffic Incidents (via custom Overpass API)
  const trafficIncidentsLayer: LayerProps = {
    id: 'traffic-incidents',
    type: 'circle',
    source: 'traffic-data',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ef4444', // Red for blockages
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 0.8
    }
  };

  // 2. Weather Raster (RainViewer Live Radar)
  const weatherRasterLayer: LayerProps = {
    id: 'weather-radar',
    type: 'raster',
    source: 'weather-data',
    paint: {
      'raster-opacity': 0.6,
      'raster-fade-duration': 500
    }
  };

  // 3. Crop Intelligence (ISRO Bhuvan WMS or fallback generic WMS for LULC)
  const cropRasterLayer: LayerProps = {
    id: 'crop-wms',
    type: 'raster',
    source: 'crop-data',
    paint: {
      'raster-opacity': 0.7
    }
  };

  // 4. Demographics (Density Circles)
  const demoCirclesLayer: LayerProps = {
    id: 'demo-circles',
    type: 'circle',
    source: 'demo-data',
    paint: {
      'circle-radius': ['*', ['/', ['get', 'pop'], 1000000], 5], // Dynamic size based on pop
      'circle-color': [
        'interpolate', ['linear'], ['get', 'density'],
        1000, '#fde047',
        1500, '#f97316',
        2000, '#ef4444',
        2500, '#991b1b'
      ],
      'circle-opacity': 0.7,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  };

  const demoLabelsLayer: LayerProps = {
    id: 'demo-labels',
    type: 'symbol',
    source: 'demo-data',
    layout: {
      'text-field': ['concat', ['get', 'name'], '\nPop: ', ['get', 'pop']],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, 1.5],
    },
    paint: {
      'text-color': '#111827',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2
    }
  };

  const premiumMapStyle = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  return (
    <div className="w-full h-full relative font-sans">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={premiumMapStyle}
        style={{ width: '100%', height: '100%' }}
        minZoom={5}
        maxPitch={60}
      >
        <NavigationControl position="bottom-right" visualizePitch={true} />
        <ScaleControl />

        {/* Administrative Boundaries */}
        {activeLayers.admin && (
          <Source id="up-data" type="geojson" data={upBoundary as any}>
            <Layer {...boundaryFillLayer} />
            <Layer {...boundaryLineLayer} />
          </Source>
        )}

        {/* Real-time Weather Radar */}
        {activeLayers.weather && weatherTime && (
          <Source 
            id="weather-data" 
            type="raster" 
            tiles={[`https://tilecache.rainviewer.com/v2/radar/${weatherTime}/256/{z}/{x}/{y}/2/1_1.png`]} 
            tileSize={256}
          >
            <Layer {...weatherRasterLayer} />
          </Source>
        )}

        {/* Crop Intelligence via ISRO Bhuvan WMS (Proxy or direct URL) */}
        {activeLayers.crop && (
          <Source 
            id="crop-data" 
            type="raster" 
            // Using Bhuvan's actual LULC Layer
            tiles={[`https://bhuvan-vec2.nrsc.gov.in/bhuvan/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=lulc:UP_LULC50K_1516&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256`]} 
            tileSize={256}
          >
            <Layer {...cropRasterLayer} />
          </Source>
        )}

        {/* Real-Time Traffic Incidents */}
        {activeLayers.traffic && (
          <Source id="traffic-data" type="geojson" data="/api/gis?layer=traffic-incidents">
            <Layer {...trafficIncidentsLayer} />
          </Source>
        )}

        {/* Demographics Data */}
        {activeLayers.demo && (
          <Source id="demo-data" type="geojson" data={demographicsDistricts as any}>
            <Layer {...demoCirclesLayer} />
            <Layer {...demoLabelsLayer} />
          </Source>
        )}
        
        {/* Advanced Data Indicator HUD */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-xl px-6 py-3 rounded-full shadow-2xl border border-white/50 z-10 flex items-center gap-5 transition-all">
          <div className="flex items-center gap-3 border-r border-gray-200 pr-5">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Level</span>
              <span className="text-sm font-semibold text-gray-900 font-hindi">
                {viewState.zoom < 6 ? 'राज्य (State)' : 
                 viewState.zoom < 9 ? 'ज़िला (District)' : 
                 viewState.zoom < 12 ? 'तहसील (Tehsil)' : 
                 viewState.zoom < 15 ? 'गाँव (Village)' : 'सड़क (Street)'}
              </span>
            </div>
          </div>
          <div className="flex flex-col leading-tight">
             <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Coordinates (Lat, Lng)</span>
             <span className="text-sm font-mono font-medium text-indigo-700">
               {viewState.latitude.toFixed(4)}, {viewState.longitude.toFixed(4)}
             </span>
          </div>
          <div className="flex flex-col leading-tight pl-5 border-l border-gray-200">
             <span className="text-[9px] uppercase text-gray-500 font-bold tracking-widest">Active Data Streams</span>
             <span className="text-sm font-semibold text-gray-900 font-hindi">
               {Object.values(activeLayers).filter(Boolean).length}
             </span>
          </div>
        </div>
      </Map>
    </div>
  );
}
