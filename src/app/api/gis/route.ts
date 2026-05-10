import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');

  const getOverpassQuery = (layer: string) => {
    // UP Bounding Box
    const bbox = "23.8,77.0,30.4,84.5";
    let query = "";
    switch(layer) {
      case 'traffic-incidents': query = `node(${bbox})["highway"="construction"];`; break;
      case 'bank-branch': query = `node(${bbox})["amenity"="bank"];`; break;
      case 'atm': query = `node(${bbox})["amenity"="atm"];`; break;
      case 'school': query = `node(${bbox})["amenity"="school"];`; break;
      case 'health-center': query = `node(${bbox})["amenity"~"hospital|clinic"];`; break;
      case 'csc': query = `node(${bbox})["office"="government"];`; break;
      case 'bank-mitra': query = `node(${bbox})["amenity"="post_office"];`; break;
      case 'pds': query = `node(${bbox})["shop"="convenience"];`; break;
      default: return null;
    }
    return `[out:json][timeout:25];${query}out 500;`;
  };

  const query = getOverpassQuery(layer || '');

  if (query) {
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        next: { revalidate: 3600 } // Cache for 1 hour to prevent Overpass blocking
      });
      
      if (!response.ok) {
         throw new Error("Overpass API failed");
      }

      const data = await response.json();
      
      const geojson = {
        type: 'FeatureCollection',
        features: (data.elements || []).map((el: any) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [el.lon, el.lat]
          },
          properties: {
            id: el.id,
            type: layer,
            name: el.tags?.name || el.tags?.operator || `Unnamed ${layer}`,
            ...el.tags
          }
        }))
      };
      
      return NextResponse.json(geojson);
    } catch (e) {
      console.error("GIS API Error:", e);
      return NextResponse.json({ type: 'FeatureCollection', features: [] });
    }
  }

  return NextResponse.json({ error: 'Layer not found' }, { status: 404 });
}
