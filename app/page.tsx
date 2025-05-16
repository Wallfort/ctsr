'use client';

import { useState } from 'react';
import { RegistriSection } from './components/registri/registri-section';
import { BrogliaccioSection } from './components/brogliaccio-section';

export default function Home() {
  const [showBrogliaccio, setShowBrogliaccio] = useState(true);

  return (
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
        {showBrogliaccio && <BrogliaccioSection />}
      </div>
      <RegistriSection />
    </div>
  );
} 