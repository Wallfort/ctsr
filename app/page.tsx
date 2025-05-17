'use client';

import { useState, useEffect } from 'react';
import { RegistriSection } from './components/registri/registri-section';
import { BrogliaccioSection } from './components/brogliaccio-section';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Sidebar } from './components/sidebar';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showBrogliaccio, setShowBrogliaccio] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Recupera la data dall'URL o usa la data odierna
  const brogliaccioDate = searchParams.get('data') 
    ? parseISO(searchParams.get('data')!)
    : new Date();

  const handleBrogliaccioDateChange = (newDate: Date) => {
    // Aggiorna l'URL con la nuova data
    const params = new URLSearchParams(searchParams.toString());
    params.set('data', format(newDate, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative flex">
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
        <div className="space-y-8">
          <div className="sticky top-0 z-20 bg-gray-50 pt-2 pb-4">
            <div className="flex justify-end mb-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                onClick={() => setShowBrogliaccio((v) => !v)}
              >
                {showBrogliaccio ? 'Nascondi brogliaccio' : 'Mostra brogliaccio'}
              </button>
            </div>
            {showBrogliaccio && (
              <BrogliaccioSection 
                selectedDate={brogliaccioDate}
                onDateChange={handleBrogliaccioDateChange}
              />
            )}
          </div>
          <RegistriSection />
        </div>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Sidebar data={brogliaccioDate} />
      </div>

      {/* Toggle button */}
      <Button
        variant="outline"
        size="icon"
        className={`fixed right-4 top-4 z-30 transition-transform duration-300 ${
          showSidebar ? 'translate-x-[-320px]' : ''
        }`}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
} 