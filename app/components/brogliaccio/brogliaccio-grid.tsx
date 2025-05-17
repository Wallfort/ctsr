import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useSelector } from '@/lib/context/selector-context';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { isFestivoItaliano } from '@/lib/utils/date';

type RegistroAssenza = Database['public']['Tables']['registro_assenze']['Row'] & {
  agente: Database['public']['Tables']['agenti']['Row'];
  tipi_assenza: Database['public']['Tables']['tipi_assenza']['Row'];
};

type AssenzePerAgente = {
  agente: Database['public']['Tables']['agenti']['Row'];
  assenze: Record<string, RegistroAssenza>;
};

type BrogliaccioGridProps = {
  mese: Date;
};

export function BrogliaccioGrid({ mese }: BrogliaccioGridProps) {
  const { selectedMansioneId } = useSelector();
  const [assenzePerAgente, setAssenzePerAgente] = useState<AssenzePerAgente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [selectedMansioneId, mese]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Recupera le assenze per il mese selezionato, filtrate per mansione
      const dataInizio = startOfMonth(mese);
      const dataFine = endOfMonth(mese);

      // Prima recupera gli agenti della mansione selezionata
      const { data: agenti, error: agentiError } = await supabase
        .from('agenti')
        .select('id')
        .eq('mansione_id', selectedMansioneId);

      if (agentiError) {
        throw new Error(`Errore nel recupero degli agenti: ${agentiError.message}`);
      }

      if (!agenti || agenti.length === 0) {
        setAssenzePerAgente([]);
        return;
      }

      // Poi recupera le assenze solo per gli agenti della mansione selezionata
      const { data: assenzeData, error: assenzeError } = await supabase
        .from('registro_assenze')
        .select(`
          *,
          agente:agenti (*),
          tipi_assenza:tipi_assenza (*)
        `)
        .gte('data', dataInizio.toISOString())
        .lte('data', dataFine.toISOString())
        .in('agente_id', agenti.map(a => a.id))
        .eq('mansione_id', selectedMansioneId);

      if (assenzeError) {
        throw new Error(`Errore nel recupero delle assenze: ${assenzeError.message}`);
      }

      // Raggruppa le assenze per agente
      const assenzePerAgenteMap = new Map<string, AssenzePerAgente>();
      
      assenzeData.forEach(assenza => {
        const agenteId = assenza.agente.id;
        if (!assenzePerAgenteMap.has(agenteId)) {
          assenzePerAgenteMap.set(agenteId, {
            agente: assenza.agente,
            assenze: {}
          });
        }
        const agenteData = assenzePerAgenteMap.get(agenteId)!;
        agenteData.assenze[assenza.data] = assenza as RegistroAssenza;
      });

      setAssenzePerAgente(Array.from(assenzePerAgenteMap.values()));
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
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Brogliaccio Assenze</h2>
      
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
            {assenzePerAgente.map(({ agente, assenze }) => (
              <tr key={agente.id}>
                <td className="border p-2 font-medium">
                  <span className="uppercase">
                    {agente.cognome} {agente.nome} ({agente.matricola})
                  </span>
                </td>
                {giorniMese.map(giorno => {
                  const dataLocale = format(giorno, 'yyyy-MM-dd');
                  const assenza = assenze[dataLocale];
                  const isFestivo = isFestivoItaliano(giorno);
                  
                  return (
                    <td key={giorno.toISOString()} className={`border p-2 text-center ${isFestivo ? 'bg-red-50' : ''}`}>
                      {assenza && (
                        <div className="text-lg font-bold text-red-600 bg-white px-2 py-1 rounded shadow-md border border-red-200">
                          {assenza.tipi_assenza.codice}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 