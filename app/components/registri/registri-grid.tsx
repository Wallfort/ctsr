'use client';

import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSunday, getDay, getDate, getMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { useSelector } from '@/lib/context/selector-context';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/supabase';

// Funzione per verificare se una data è un festivo italiano
function isFestivoItaliano(data: Date): boolean {
  const giorno = getDate(data);
  const mese = getMonth(data);
  const giornoSettimana = getDay(data);

  // Domenica
  if (giornoSettimana === 0) return true;

  // Festivi fissi
  const festiviFissi = [
    { giorno: 1, mese: 0 },   // Capodanno
    { giorno: 6, mese: 0 },   // Epifania
    { giorno: 25, mese: 3 },  // Liberazione
    { giorno: 1, mese: 4 },   // Festa del Lavoro
    { giorno: 2, mese: 5 },   // Repubblica
    { giorno: 15, mese: 7 },  // Ferragosto
    { giorno: 1, mese: 10 },  // Tutti i Santi
    { giorno: 8, mese: 11 },  // Immacolata
    { giorno: 25, mese: 11 }, // Natale
    { giorno: 26, mese: 11 }, // Santo Stefano
  ];

  return festiviFissi.some(festivo => festivo.giorno === giorno && festivo.mese === mese);
}

type RegistroTurno = Database['public']['Tables']['registro_turni_ordinari']['Row'] & {
  turno: Database['public']['Tables']['turni']['Row'];
  agente: Database['public']['Tables']['agenti']['Row'] | null;
  posizione: Database['public']['Tables']['posizioni']['Row'];
};

type RegistriGridProps = {
  mese: Date;
};

export function RegistriGrid({ mese }: RegistriGridProps) {
  const { selectedSection } = useSelector();
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [registri, setRegistri] = useState<Record<string, Record<string, RegistroTurno[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [selectedSection, mese]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Recupera impianti e mansioni
      const [impiantiData, mansioniData] = await Promise.all([
        impiantiService.getAll(),
        mansioniService.getAll()
      ]);

      console.log('Impianti recuperati:', impiantiData);
      console.log('Mansioni recuperate:', mansioniData);

      // Filtra gli impianti in base alla mansione selezionata
      const impiantiFiltrati = impiantiData.filter(impianto => {
        const mansione = mansioniData.find(m => m.id === impianto.mansione_id);
        return mansione?.nome.toLowerCase().includes(selectedSection.toLowerCase());
      });

      console.log('Impianti filtrati:', impiantiFiltrati);
      console.log('Sezione selezionata:', selectedSection);

      setImpianti(impiantiFiltrati);

      // Recupera i registri per il mese selezionato
      const dataInizio = startOfMonth(mese);
      const dataFine = endOfMonth(mese);

      console.log('Periodo:', { dataInizio, dataFine });

      const { data: registriData, error: registriError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          *,
          turno:turni (*),
          agente:agenti!registro_turni_ordinari_agente_id_fkey (*),
          posizione:posizioni (*)
        `)
        .gte('data', dataInizio.toISOString())
        .lte('data', dataFine.toISOString())
        .in('impianto_id', impiantiFiltrati.map(i => i.id));

      if (registriError) {
        console.error('Errore nel recupero dei registri:', registriError);
        throw new Error(`Errore nel recupero dei registri: ${registriError.message}`);
      }

      console.log('Registri recuperati:', registriData);

      // Organizza i registri per impianto e data
      const registriOrganizzati: Record<string, Record<string, RegistroTurno[]>> = {};
      registriData.forEach(registro => {
        // Converti la data in formato locale
        const dataLocale = format(parseISO(registro.data), 'yyyy-MM-dd');
        
        if (!registriOrganizzati[registro.impianto_id]) {
          registriOrganizzati[registro.impianto_id] = {};
        }
        if (!registriOrganizzati[registro.impianto_id][dataLocale]) {
          registriOrganizzati[registro.impianto_id][dataLocale] = [];
        }
        registriOrganizzati[registro.impianto_id][dataLocale].push(registro as RegistroTurno);
      });

      console.log('Registri organizzati:', registriOrganizzati);

      setRegistri(registriOrganizzati);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Caricamento...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const giorniMese = eachDayOfInterval({
    start: startOfMonth(mese),
    end: endOfMonth(mese)
  });

  return (
    <div className="space-y-8">
      {impianti.map(impianto => {
        // Raggruppa i turni per posizione per questo impianto
        const turniPerPosizione = new Map<string, RegistroTurno[]>();
        
        // Per ogni giorno del mese
        giorniMese.forEach(giorno => {
          const dataLocale = format(giorno, 'yyyy-MM-dd');
          const turniGiorno = registri[impianto.id]?.[dataLocale] || [];
          
          // Per ogni turno del giorno
          turniGiorno.forEach(turno => {
            const posizioneId = turno.posizione.id;
            if (!turniPerPosizione.has(posizioneId)) {
              turniPerPosizione.set(posizioneId, []);
            }
            turniPerPosizione.get(posizioneId)?.push(turno);
          });
        });

        console.log(`Turni per posizione per ${impianto.nome}:`, Object.fromEntries(turniPerPosizione));

        return (
          <div key={impianto.id} className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">{impianto.nome}</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50">Agente</th>
                    {giorniMese.map(giorno => {
                      const isFestivo = isFestivoItaliano(giorno);
                      return (
                        <th key={giorno.toISOString()} className="border p-2 bg-gray-50">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm ${isFestivo ? 'text-red-600' : ''}`}>
                              {format(giorno, 'EEE', { locale: it })}
                            </span>
                            <span className={`text-lg font-semibold ${isFestivo ? 'text-red-600' : ''}`}>
                              {format(giorno, 'd', { locale: it })}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(turniPerPosizione.entries()).map(([posizioneId, turni]) => {
                    const agente = turni[0]?.agente;
                    const posizione = turni[0]?.posizione;
                    
                    return (
                      <tr key={posizioneId}>
                        <td className="border p-2 font-medium">
                          {agente ? (
                            <span className="uppercase">
                              {agente.cognome} {agente.nome} ({agente.matricola})
                            </span>
                          ) : (
                            `TURNO VACANTE (Pos. ${posizione?.numero})`
                          )}
                        </td>
                        {giorniMese.map(giorno => {
                          const dataLocale = format(giorno, 'yyyy-MM-dd');
                          const turno = turni.find(t => format(parseISO(t.data), 'yyyy-MM-dd') === dataLocale);
                          const isFestivo = isFestivoItaliano(giorno);
                          
                          return (
                            <td key={giorno.toISOString()} className={`border p-2 text-center ${isFestivo ? 'bg-red-50' : ''}`}>
                              {turno ? (
                                <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                                  {turno.turno.codice}
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
} 