'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export function BrogliaccioSection() {
  const [data, setData] = useState(new Date());

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Brogliaccio</h2>
        <div className="text-sm text-gray-500">
          {format(data, 'dd MMMM yyyy', { locale: it })}
        </div>
      </div>

      <div className="space-y-4">
        {/* Qui andrà il contenuto del brogliaccio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Turni del Giorno</h3>
            <p className="text-gray-600">Lista dei turni in arrivo...</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Note e Comunicazioni</h3>
            <p className="text-gray-600">Area per note e comunicazioni...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 