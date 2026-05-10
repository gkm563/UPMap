"use client";

import { useState, useCallback } from 'react';
import Map, { NavigationControl, ScaleControl, Source, Layer, LayerProps } from 'react-map-gl/maplibre';
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

// Mock Districts (Points for Labels)
const districts = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.9462, 26.8467] }, properties: { name: 'लखनऊ (Lucknow)', type: 'district' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.3319, 26.4499] }, properties: { name: 'कानपुर (Kanpur)', type: 'district' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [82.9739, 25.3176] }, properties: { name: 'वाराणसी (Varanasi)', type: 'district' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [78.0081, 27.1767] }, properties: { name: 'आगरा (Agra)', type: 'district' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [81.8463, 25.4358] }, properties: { name: 'प्रयागराज (Prayagraj)', type: 'district' } }
  ]
};

// Mock Villages near Lucknow
const villages = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.95, 26.86] }, properties: { name: 'चिनहट (Chinhat)', type: 'village', pop: 1200 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [80.92, 26.82] }, properties: { name: 'सरोजनी नगर (Sarojini Nagar)', type: 'village', pop: 3400 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [81.00, 26.90] }, properties: { name: 'बख्शी का तालाब (BKT)', type: 'village', pop: 2100 } }
  ]
};

const mapStyle = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors',
      maxzoom: 19
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
};

export default function InteractiveMap() {
  const [viewState, setViewState] = useState({
    longitude: 80.9462, // Lucknow
    latitude: 26.8467,
    zoom: 6
  });

  const boundaryLayer: LayerProps = {
    id: 'up-boundary-line',
    type: 'line',
    source: 'up-data',
    paint: { 'line-color': '#ff4d4f', 'line-width': 3, 'line-dasharray': [2, 2] }
  };
  
  const fillLayer: LayerProps = {
    id: 'up-fill',
    type: 'fill',
    source: 'up-data',
    paint: { 'fill-color': '#ff4d4f', 'fill-opacity': 0.05 }
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
      'text-offset': [0, 1],
      'text-anchor': 'top'
    },
    paint: {
      'text-color': '#333',
      'text-halo-color': '#fff',
      'text-halo-width': 2
    }
  };

  const villageLabelsLayer: LayerProps = {
    id: 'village-labels',
    type: 'symbol',
    source: 'villages',
    minzoom: 10,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 12,
      'icon-image': 'marker-15', // Need an icon or just dots
      'text-offset': [0, 1]
    },
    paint: {
      'text-color': '#d97706',
      'text-halo-color': '#fff',
      'text-halo-width': 1.5
    }
  };

  const villagePointsLayer: LayerProps = {
    id: 'village-points',
    type: 'circle',
    source: 'villages',
    minzoom: 9,
    paint: {
      'circle-radius': 5,
      'circle-color': '#d97706',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  };

  return (
    <div className="w-full h-full relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle as any}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />
        <ScaleControl />

        <Source id="up-data" type="geojson" data={upBoundary as any}>
          <Layer {...fillLayer} />
          <Layer {...boundaryLayer} />
        </Source>

        <Source id="districts" type="geojson" data={districts as any}>
          <Layer {...districtLabelsLayer} />
        </Source>

        <Source id="villages" type="geojson" data={villages as any}>
          <Layer {...villagePointsLayer} />
          <Layer {...villageLabelsLayer} />
        </Source>
        
        {/* Dynamic Zoom Level Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-gray-200 z-10 font-medium text-sm text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          ज़ूम स्तर (Zoom Level): {Math.round(viewState.zoom)}
          <span className="text-gray-400 ml-2">|</span>
          <span className="text-orange-600 font-semibold ml-2">
            {viewState.zoom < 6 ? 'राज्य (State)' : 
             viewState.zoom < 9 ? 'ज़िला (District)' : 
             viewState.zoom < 12 ? 'तहसील (Tehsil)' : 
             viewState.zoom < 15 ? 'गाँव (Village)' : 'सड़क (Street)'}
          </span>
        </div>
      </Map>
    </div>
  );
}
