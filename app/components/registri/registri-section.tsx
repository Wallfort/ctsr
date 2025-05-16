'use client';

import { useState } from 'react';
import { format, setMonth, getMonth, getYear, setYear } from 'date-fns';
import { it } from 'date-fns/locale';
import { RegistriGrid } from './registri-grid';

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const ANNI = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i);

export function RegistriSection() {
  const [mese, setMese] = useState(new Date());

  const handleMeseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMese = setMonth(mese, parseInt(e.target.value));
    setMese(newMese);
  };

  const handleAnnoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMese = setYear(mese, parseInt(e.target.value));
    setMese(newMese);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registri</h2>
        
        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="mese" className="block text-sm font-medium text-gray-700 mb-1">
              Mese di riferimento
            </label>
            <div className="flex gap-2">
              <select
                id="mese"
                value={getMonth(mese)}
                onChange={handleMeseChange}
                className="block w-[140px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {MESI.map((nomeMese, index) => (
                  <option key={nomeMese} value={index}>
                    {nomeMese}
                  </option>
                ))}
              </select>

              <select
                id="anno"
                value={getYear(mese)}
                onChange={handleAnnoChange}
                className="block w-[100px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {ANNI.map(anno => (
                  <option key={anno} value={anno}>
                    {anno}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Visualizzazione dei turni per {format(mese, 'MMMM yyyy', { locale: it })}
      </div>

      <RegistriGrid mese={mese} />
    </div>
  );
} 