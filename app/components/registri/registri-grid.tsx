'use client';

import { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isSunday, getDay, getDate, getMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { useSelector } from '@/lib/context/selector-context';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { isFestivoItaliano } from '@/lib/utils/date';
import { AssenzaModal } from './assenza-modal';
import { assenzeService } from '@/lib/services/assenze.service';

type RegistroTurno = Database['public']['Tables']['registro_turni_ordinari']['Row'] & {
  turno: Database['public']['Tables']['turni']['Row'];
  agente: Database['public']['Tables']['agenti']['Row'] & {
    registro_assenze: Array<{
      id: number;
      data: string;
      tipi_assenza: {
        id: number;
        codice: string;
        nome: string;
      };
    }> | null;
  };
  posizione: Database['public']['Tables']['posizioni']['Row'];
  assente: boolean;
  agente_id: string;
  sostituto_id: string | null;
  is_sostituto: boolean;
  sostituzione_info?: {
    impianto_id: string;
    turno_codice: string;
    is_straordinario: boolean;
  };
};

type TurnoResponse = {
  codice: string;
};

type SostitutoRecord = {
  sostituto_id: string;
  data: string;
  impianto_id: string;
  is_straordinario: boolean;
  turno: TurnoResponse;
};

type RegistriGridProps = {
  mese: Date;
};

export function RegistriGrid({ mese }: RegistriGridProps) {
  const { selectedMansioneId } = useSelector();
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [registri, setRegistri] = useState<Record<string, Record<string, RegistroTurno[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<RegistroTurno | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [selectedMansioneId, mese]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Recupera impianti e mansioni
      const [impiantiData, mansioniData] = await Promise.all([
        impiantiService.getAll(),
        mansioniService.getAll()
      ]);

      // Filtra gli impianti in base alla mansione selezionata
      const impiantiFiltrati = impiantiData.filter(impianto => 
        impianto.mansione_id === selectedMansioneId
      );

      // Recupera i registri per il mese selezionato
      const dataInizio = startOfMonth(mese);
      const dataFine = endOfMonth(mese);

      // Prima recuperiamo tutti i turni dove un agente è stato utilizzato come sostituto
      const { data: sostitutiData, error: sostitutiError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          sostituto_id,
          data,
          impianto_id,
          is_straordinario,
          turno:turni!inner (
            codice
          )
        `)
        .gte('data', dataInizio.toISOString())
        .lte('data', dataFine.toISOString())
        .not('sostituto_id', 'is', null)
        .returns<SostitutoRecord[]>();

      if (sostitutiError) {
        throw new Error(`Errore nel recupero dei sostituti: ${sostitutiError.message}`);
      }

      // Creiamo una mappa dei sostituti per data
      const sostitutiPerData = sostitutiData.reduce((acc, record) => {
        if (!acc[record.data]) {
          acc[record.data] = new Map();
        }
        acc[record.data].set(record.sostituto_id, {
          impianto_id: record.impianto_id,
          turno_codice: record.turno.codice,
          is_straordinario: record.is_straordinario
        });
        return acc;
      }, {} as Record<string, Map<string, { impianto_id: string; turno_codice: string; is_straordinario: boolean }>>);

      const { data: registriData, error: registriError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          *,
          turno:turni (*),
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            *,
            registro_assenze (
              id,
              data,
              tipi_assenza (
                id,
                codice,
                nome
              )
            )
          ),
          posizione:posizioni (*)
        `)
        .gte('data', dataInizio.toISOString())
        .lte('data', dataFine.toISOString())
        .in('impianto_id', impiantiFiltrati.map(i => i.id));

      if (registriError) {
        throw new Error(`Errore nel recupero dei registri: ${registriError.message}`);
      }

      // Organizza i registri per impianto e data
      const registriOrganizzati: Record<string, Record<string, RegistroTurno[]>> = {};
      registriData.forEach(registro => {
        const dataLocale = format(parseISO(registro.data), 'yyyy-MM-dd');
        
        if (!registriOrganizzati[registro.impianto_id]) {
          registriOrganizzati[registro.impianto_id] = {};
        }
        if (!registriOrganizzati[registro.impianto_id][dataLocale]) {
          registriOrganizzati[registro.impianto_id][dataLocale] = [];
        }

        // Aggiungiamo l'informazione se l'agente è stato utilizzato come sostituto
        const sostituzioneInfo = sostitutiPerData[registro.data]?.get(registro.agente_id);
        registriOrganizzati[registro.impianto_id][dataLocale].push({
          ...registro as RegistroTurno,
          is_sostituto: !!sostituzioneInfo,
          sostituzione_info: sostituzioneInfo
        });
      });

      // Filtra gli impianti per mostrare solo quelli che hanno turni nel registro
      const impiantiConTurni = impiantiFiltrati.filter(impianto => 
        Object.keys(registriOrganizzati[impianto.id] || {}).length > 0
      );

      setImpianti(impiantiConTurni);
      setRegistri(registriOrganizzati);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnoClick = async (turno: RegistroTurno) => {
    setSelectedTurno(turno);
    setIsModalOpen(true);
  };

  const handleSaveAssenza = async (assenzaId: number) => {
    if (!selectedTurno) return;

    setLoading(true);
    try {
      await assenzeService.assegnaAssenza(selectedTurno.id, assenzaId);
      // Ricarica i dati del registro
      await loadData();
      // Forza il ricaricamento della pagina per aggiornare il brogliaccio
      window.location.reload();
    } catch (error) {
      console.error('Errore nell\'assegnazione dell\'assenza:', error);
      alert('Errore nell\'assegnazione dell\'assenza');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleRemoveAssenza = async () => {
    if (!selectedTurno) return;

    setLoading(true);
    try {
      await assenzeService.rimuoviAssenza(selectedTurno.id);
      // Ricarica i dati del registro
      await loadData();
      // Forza il ricaricamento della pagina per aggiornare il brogliaccio
      window.location.reload();
    } catch (error) {
      console.error('Errore nella rimozione dell\'assenza:', error);
      alert('Errore nella rimozione dell\'assenza');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
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
                  {Array.from(turniPerPosizione.entries())
                    .sort(([_, turniA], [__, turniB]) => {
                      const posizioneA = turniA[0]?.posizione?.numero || 0;
                      const posizioneB = turniB[0]?.posizione?.numero || 0;
                      return posizioneA - posizioneB;
                    })
                    .map(([posizioneId, turni]) => {
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
                                <div className="flex flex-col items-center gap-1">
                                  {turno.is_sostituto && turno.sostituzione_info && (
                                    turno.sostituzione_info.impianto_id === turno.impianto_id ? (
                                      <div className={`text-lg font-bold text-blue-600 bg-white px-2 py-1 ${turno.sostituzione_info.is_straordinario ? 'rounded-full ring-2 ring-red-500' : 'rounded shadow-md border border-blue-200'}`}>
                                        {turno.sostituzione_info.turno_codice}
                                      </div>
                                    ) : (
                                      <div className={`text-lg font-bold text-blue-600 bg-white px-2 py-1 ${turno.sostituzione_info.is_straordinario ? 'rounded-full ring-2 ring-red-500' : 'rounded shadow-md border border-blue-200'}`}>
                                        T<sup className="text-sm">{turno.sostituzione_info.turno_codice}</sup>
                                      </div>
                                    )
                                  )}
                                  {turno.assente && turno.agente_id && !turno.sostituto_id && turno.agente?.registro_assenze && turno.agente.registro_assenze.length > 0 && (
                                    <div className="text-lg font-bold text-red-600 bg-white px-2 py-1 rounded shadow-md border border-red-200">
                                      {turno.agente.registro_assenze.find(
                                        assenza => assenza.data === turno.data
                                      )?.tipi_assenza.codice}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleTurnoClick(turno)}
                                    className={`px-2 py-1 rounded relative ${
                                      turno.assente
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    } hover:opacity-80 transition-opacity`}
                                  >
                                    {turno.turno.codice}
                                    {turno.assente && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-red-800 transform rotate-45 origin-center"></div>
                                      </div>
                                    )}
                                  </button>
                                </div>
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

      <AssenzaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAssenza}
        onRemove={handleRemoveAssenza}
        currentAssenzaId={selectedTurno?.agente?.registro_assenze?.find(
          assenza => assenza.data === selectedTurno.data
        )?.tipi_assenza.id}
      />
    </div>
  );
} 