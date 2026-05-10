"use client";

import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';

const MapComponent = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">मैप लोड हो रहा है... (Loading Map...)</p>
      </div>
    </div>
  )
});

export default function Home() {
  return (
    <main className="w-screen h-screen relative overflow-hidden bg-gray-50">
      <MapComponent />
      <Sidebar />
    </main>
  );
}
