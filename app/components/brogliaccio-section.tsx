'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { getBrogliaccioEntries, type BrogliaccioEntry } from '@/lib/services/brogliaccio.service';

export function BrogliaccioSection() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<BrogliaccioEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEntries() {
      setLoading(true);
      const data = await getBrogliaccioEntries(selectedDate);
      setEntries(data);
      setLoading(false);
    }
    loadEntries();
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700">Brogliaccio</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Data di riferimento:</span>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            locale={it}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fono
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impianto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agente Assente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assenza
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turno
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prestazione
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sostituto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conferma
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Caricamento...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessun turno scoperto per questa data
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.impianto}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.agente_assente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.tipo_assenza}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.turno}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.sostituto_id || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 