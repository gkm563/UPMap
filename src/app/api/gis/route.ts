import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');

  if (layer === 'traffic-incidents') {
    // Fetch live construction and road blockages from OpenStreetMap (Overpass API)
    // Bounding box for UP approx: 23.8,77.0,30.4,84.5
    const overpassQuery = `
      [out:json];
      node(23.8,77.0,30.4,84.5)["highway"="construction"];
      out 100;
    `;
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        next: { revalidate: 300 } // Cache for 5 mins
      });
      
      const data = await response.json();
      
      // Convert to GeoJSON
      const geojson = {
        type: 'FeatureCollection',
        features: data.elements.map((el: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [el.lon, el.lat]
          },
          properties: {
            id: el.id,
            type: 'Road Construction / Blockage',
            description: el.tags?.description || 'Ongoing road work affecting traffic',
          }
        }))
      };
      
      return NextResponse.json(geojson);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ type: 'FeatureCollection', features: [] });
    }
  }

  return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
}
