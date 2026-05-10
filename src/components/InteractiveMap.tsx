"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Map, { NavigationControl, ScaleControl, Source, Layer, LayerProps, MapRef, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BASEMAPS } from './Sidebar';

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
  const [hoverInfo, setHoverInfo] = useState<{x: number, y: number, feature: any} | null>(null);

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

  const mapStyle = useMemo(() => {
    if (activeBasemapId === 'no-basemap') {
      return { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#f3f4f6' } }] };
    }
    const basemapUrl = BASEMAPS.find(b => b.id === activeBasemapId)?.url;
    return {
      version: 8,
      sources: {
        'basemap-raster': {
          type: 'raster',
          tiles: [basemapUrl || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256
        }
      },
      layers: [{ id: 'basemap-layer', type: 'raster', source: 'basemap-raster', minzoom: 0, maxzoom: 22 }]
    };
  }, [activeBasemapId]);

  const getPoiPaint = (color: string) => ({
    'circle-radius': 6,
    'circle-color': color,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  });

  const onHover = useCallback((event: any) => {
    const { features, point } = event;
    const hoveredFeature = features && features[0];
    if (hoveredFeature) {
      setHoverInfo({ x: point.x, y: point.y, feature: hoveredFeature });
    } else {
      setHoverInfo(null);
    }
  }, []);

  const interactiveLayerIds = [
    'layer-bank-branch', 'layer-bank-mitra', 'layer-atm', 
    'layer-school', 'layer-csc', 'layer-health-center', 'layer-pds'
  ];

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
        interactiveLayerIds={interactiveLayerIds}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <NavigationControl position="bottom-right" visualizePitch={true} />
        <ScaleControl />

        {/* Real Admin Boundaries from accurate GeoJSON file */}
        {activeLayers.admin && (
          <Source id="up-data" type="geojson" data="/data/up_districts.geojson">
            <Layer id="up-fill" type="fill" paint={{ 'fill-color': '#4f46e5', 'fill-opacity': 0.1 }} />
            <Layer id="up-line" type="line" paint={{ 'line-color': '#1e1b4b', 'line-width': 1.5 }} />
          </Source>
        )}

        {/* Authentic Dynamic POI Layers fetching from Real-Time OSM */}
        {activeLayers['bank-branch'] && (
          <Source id="bank-branch" type="geojson" data="/api/gis?layer=bank-branch">
            <Layer id="layer-bank-branch" type="circle" paint={getPoiPaint('#16a34a')} />
          </Source>
        )}
        {activeLayers['bank-mitra'] && (
          <Source id="bank-mitra" type="geojson" data="/api/gis?layer=bank-mitra">
            <Layer id="layer-bank-mitra" type="circle" paint={getPoiPaint('#059669')} />
          </Source>
        )}
        {activeLayers['atm'] && (
          <Source id="atm" type="geojson" data="/api/gis?layer=atm">
            <Layer id="layer-atm" type="circle" paint={getPoiPaint('#d97706')} />
          </Source>
        )}
        {activeLayers['school'] && (
          <Source id="school" type="geojson" data="/api/gis?layer=school">
            <Layer id="layer-school" type="circle" paint={getPoiPaint('#2563eb')} />
          </Source>
        )}
        {activeLayers['csc'] && (
          <Source id="csc" type="geojson" data="/api/gis?layer=csc">
            <Layer id="layer-csc" type="circle" paint={getPoiPaint('#7c3aed')} />
          </Source>
        )}
        {activeLayers['health-center'] && (
          <Source id="health-center" type="geojson" data="/api/gis?layer=health-center">
            <Layer id="layer-health-center" type="circle" paint={getPoiPaint('#e11d48')} />
          </Source>
        )}
        {activeLayers['pds'] && (
          <Source id="pds" type="geojson" data="/api/gis?layer=pds">
            <Layer id="layer-pds" type="circle" paint={getPoiPaint('#ea580c')} />
          </Source>
        )}

        {/* Radar Layer */}
        {activeLayers.radar && weatherTime && (
          <Source id="radar-data" type="raster" tiles={[`https://tilecache.rainviewer.com/v2/radar/${weatherTime}/256/{z}/{x}/{y}/2/1_1.png`]} tileSize={256}>
            <Layer id="layer-radar" type="raster" paint={{ 'raster-opacity': 0.6 }} />
          </Source>
        )}

        {hoverInfo && (
          <div className="absolute bg-white text-gray-800 px-3 py-2 rounded-lg shadow-xl text-xs font-semibold border border-gray-100 pointer-events-none transform -translate-x-1/2 -translate-y-[120%]" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
            {hoverInfo.feature.properties.name || hoverInfo.feature.properties.type}
          </div>
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
