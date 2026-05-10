import { NextResponse } from 'next/server';

const MOCK_DATA = [
  { id: 1, nameHi: 'लखनऊ', nameEn: 'Lucknow', type: 'District', coordinates: [80.9462, 26.8467] },
  { id: 2, nameHi: 'कानपुर', nameEn: 'Kanpur', type: 'District', coordinates: [80.3319, 26.4499] },
  { id: 3, nameHi: 'वाराणसी', nameEn: 'Varanasi', type: 'District', coordinates: [82.9739, 25.3176] },
  { id: 4, nameHi: 'आगरा', nameEn: 'Agra', type: 'District', coordinates: [78.0081, 27.1767] },
  { id: 5, nameHi: 'प्रयागराज', nameEn: 'Prayagraj', type: 'District', coordinates: [81.8463, 25.4358] },
  { id: 6, nameHi: 'गोरखपुर', nameEn: 'Gorakhpur', type: 'District', coordinates: [83.3732, 26.7606] },
  { id: 7, nameHi: 'अयोध्या', nameEn: 'Ayodhya', type: 'District', coordinates: [82.1373, 26.7922] },
  { id: 8, nameHi: 'मेरठ', nameEn: 'Meerut', type: 'District', coordinates: [77.7082, 28.9845] },
  { id: 9, nameHi: 'अलीगढ़', nameEn: 'Aligarh', type: 'District', coordinates: [78.0716, 27.8974] },
  { id: 10, nameHi: 'मथुरा', nameEn: 'Mathura', type: 'District', coordinates: [77.6737, 27.4924] },
  { id: 11, nameHi: 'चिनहट', nameEn: 'Chinhat', type: 'Village', coordinates: [80.95, 26.86], parent: 'Lucknow' },
  { id: 12, nameHi: 'सरोजनी नगर', nameEn: 'Sarojini Nagar', type: 'Village', coordinates: [80.92, 26.82], parent: 'Lucknow' },
  { id: 13, nameHi: 'बख्शी का तालाब', nameEn: 'Bakshi Ka Talab', type: 'Village', coordinates: [81.00, 26.90], parent: 'Lucknow' },
  { id: 14, nameHi: 'गोमती नगर', nameEn: 'Gomti Nagar', type: 'Locality', coordinates: [80.99, 26.85], parent: 'Lucknow' }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const query = q.toLowerCase();
  
  const results = MOCK_DATA.filter(item => 
    item.nameHi.includes(query) || 
    item.nameEn.toLowerCase().includes(query)
  );

  return NextResponse.json({ results: results.slice(0, 5) });
}
