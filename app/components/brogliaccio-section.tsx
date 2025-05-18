'use client';

import { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { getBrogliaccioEntries, type BrogliaccioEntry } from '@/lib/services/brogliaccio.service';
import { createClient } from '@/lib/supabase/client';
import { useSelector } from '@/lib/context/selector-context';

interface BrogliaccioSectionProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function BrogliaccioSection({ selectedDate, onDateChange }: BrogliaccioSectionProps) {
  const { selectedMansioneId } = useSelector();
  const [entries, setEntries] = useState<BrogliaccioEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmedRows, setConfirmedRows] = useState<Set<number>>(new Set());
  const [selectedPrestazione, setSelectedPrestazione] = useState<number | null>(null);
  const [selectedSostituto, setSelectedSostituto] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [agentiDisponibili, setAgentiDisponibili] = useState<Array<{
    id: string;
    nome: string;
    cognome: string;
    impianto: string;
  }>>([]);
  const [isLoadingAgenti, setIsLoadingAgenti] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getPrestazioneCode = (prestazione: string | undefined | null) => {
    if (!prestazione) return '-';
    
    const codes: Record<string, string> = {
      'cambio_turno': 'CT',
      'doppio_turno': 'DT',
      'doppio_rc': 'D/MRC',
      'disponibilita': '/',
      'mancato_riposo_compensativo': 'MRC'
    };
    
    return codes[prestazione] || prestazione;
  };

  useEffect(() => {
    async function loadEntries() {
      if (!selectedMansioneId) {
        setEntries([]);
        return;
      }

      setLoading(true);
      const data = await getBrogliaccioEntries(selectedDate, selectedMansioneId);
      setEntries(data);
      // Inizializza le righe confermate per i turni non ordinari
      const initialConfirmed = new Set(
        data
          .map((entry, index) => entry.is_non_ordinario ? index : -1)
          .filter(index => index !== -1)
      );
      setConfirmedRows(initialConfirmed);
      setLoading(false);
    }
    loadEntries();
  }, [selectedDate, selectedMansioneId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSelectedPrestazione(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleConfirmation = (index: number) => {
    setConfirmedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handlePrestazioneClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setMenuPosition({
      top: rect.top - 160, // Ridotto da 200 a 160 per avvicinare il menu al campo
      left: rect.left
    });
    
    setSelectedPrestazione(prev => prev === index ? null : index);
  };

  const handlePrestazioneSelect = async (prestazione: string | null) => {
    if (selectedPrestazione === null) return;

    const entry = entries[selectedPrestazione];
    if (!entry) return;

    try {
      const supabase = createClient();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Prima verifichiamo che il record esista usando l'ID del turno
      const { data: existingRecord, error: checkError } = await supabase
        .from('registro_turni_ordinari')
        .select('*')
        .eq('impianto_id', entry.impianto_id)
        .eq('data', formattedDate)
        .eq('turno_id', entry.turno_id)
        .single();

      if (checkError) {
        console.error('Errore nel controllo del record:', checkError);
        throw checkError;
      }

      if (!existingRecord) {
        console.error('Record non trovato:', {
          impianto_id: entry.impianto_id,
          data: formattedDate,
          turno_id: entry.turno_id
        });
        throw new Error('Record non trovato');
      }

      console.log('Record trovato:', existingRecord);

      // Aggiorniamo il record specifico
      const { data, error } = await supabase
        .from('registro_turni_ordinari')
        .update({ 
          prestazione_sostituto: prestazione,
          sostituto_id: null, // Rimuoviamo il sostituto quando cambiamo la prestazione
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (error) {
        console.error('Errore Supabase nell\'aggiornamento:', error);
        throw error;
      }

      console.log('Risultato aggiornamento:', data);

      // Aggiorna l'entry locale
      const updatedEntries = [...entries];
      updatedEntries[selectedPrestazione] = {
        ...entry,
        prestazione_sostituto: prestazione || undefined,
        sostituto_id: undefined,
        sostituto: undefined
      };
      setEntries(updatedEntries);

      // Ricarica i dati per assicurarsi che tutto sia sincronizzato
      if (selectedMansioneId) {
        const newData = await getBrogliaccioEntries(selectedDate, selectedMansioneId);
        setEntries(newData);
      }

    } catch (error) {
      console.error('Errore completo:', error);
      alert('Si è verificato un errore durante l\'aggiornamento della prestazione. Riprova più tardi.');
    } finally {
      setSelectedPrestazione(null);
    }
  };

  const handleSostitutoClick = async (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const entry = entries[index];
    if (!entry || entry.prestazione_sostituto !== 'disponibilita') return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    setMenuPosition({
      top: rect.top - 120, // Ridotto da 160 a 120 per avvicinare il menu
      left: rect.left
    });
    
    setSelectedSostituto(prev => prev === index ? null : index);
    await loadAgentiDisponibili(index);
  };

  const loadAgentiDisponibili = async (index: number) => {
    const entry = entries[index];
    if (!entry || !selectedMansioneId) return;

    try {
      setIsLoadingAgenti(true);
      const supabase = createClient();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Recupera gli impianti associati alla mansione selezionata
      const { data: impianti, error: impiantiError } = await supabase
        .from('impianti')
        .select('id')
        .eq('mansione_id', selectedMansioneId)
        .eq('stato', 'attivo');

      if (impiantiError) throw impiantiError;

      if (!impianti || impianti.length === 0) {
        setAgentiDisponibili([]);
        return;
      }

      // Recupera gli agenti disponibili dai turni
      const { data: agentiDisponibiliData, error: disponibiliError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            id,
            nome,
            cognome
          ),
          sostituto_id,
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
            nome
          )
        `)
        .eq('data', formattedDate)
        .eq('is_disponibile', true)
        .in('impianto_id', impianti.map(i => i.id))
        .eq('mansione_id', selectedMansioneId);

      if (disponibiliError) throw disponibiliError;

      // Recupera gli agenti già utilizzati come sostituti
      const { data: sostitutiData, error: sostitutiError } = await supabase
        .from('registro_turni_ordinari')
        .select('sostituto_id')
        .eq('data', formattedDate)
        .not('sostituto_id', 'is', null);

      if (sostitutiError) throw sostitutiError;

      // Crea un Set con gli ID degli agenti già utilizzati come sostituti
      const sostitutiIds = new Set(sostitutiData?.map(s => s.sostituto_id) || []);

      // Recupera gli agenti disponibili dalle assenze
      const { data: agentiDisponibiliAssenzeData, error: disponibiliAssenzeError } = await supabase
        .from('registro_assenze')
        .select(`
          agente:agenti!registro_assenze_agente_id_fkey (
            id,
            nome,
            cognome
          )
        `)
        .eq('data', formattedDate)
        .eq('is_disponibile', true)
        .eq('mansione_id', selectedMansioneId);

      if (disponibiliAssenzeError) throw disponibiliAssenzeError;

      // Recupera gli impianti per gli agenti dalle assenze
      const impiantiAssenze = await Promise.all(
        (agentiDisponibiliAssenzeData || []).map(async (assenza) => {
          const { data: turno } = await supabase
            .from('registro_turni_ordinari')
            .select(`
              impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
                nome
              )
            `)
            .eq('agente_id', assenza.agente.id)
            .eq('data', formattedDate)
            .single();

          return {
            agente_id: assenza.agente.id,
            impianto: turno?.impianto?.nome || 'N/A'
          };
        })
      );

      // Combina e filtra i risultati
      const disponibili = [
        ...(agentiDisponibiliData?.filter(a => a.agente && !a.sostituto_id && !sostitutiIds.has(a.agente.id)).map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: a.impianto.nome
        })) || []),
        ...(agentiDisponibiliAssenzeData?.filter(a => !sostitutiIds.has(a.agente.id)).map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: impiantiAssenze.find(i => i.agente_id === a.agente.id)?.impianto || 'N/A'
        })) || [])
      ].sort((a, b) => {
        if (a.cognome === b.cognome) {
          return a.nome.localeCompare(b.nome);
        }
        return a.cognome.localeCompare(b.cognome);
      });

      setAgentiDisponibili(disponibili);
    } catch (error) {
      console.error('Errore nel caricamento degli agenti disponibili:', error);
    } finally {
      setIsLoadingAgenti(false);
    }
  };

  const handleSostitutoSelect = async (sostitutoId: string | null) => {
    if (selectedSostituto === null) return;

    const entry = entries[selectedSostituto];
    if (!entry) return;

    try {
      const supabase = createClient();
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      console.log('Aggiornamento sostituto:', {
        impianto_id: entry.impianto_id,
        data: formattedDate,
        sostituto_id: sostitutoId,
        turno_id: entry.turno_id
      });

      // Prima verifichiamo che il record esista usando l'ID del turno
      const { data: existingRecord, error: checkError } = await supabase
        .from('registro_turni_ordinari')
        .select('*')
        .eq('impianto_id', entry.impianto_id)
        .eq('data', formattedDate)
        .eq('turno_id', entry.turno_id)
        .single();

      if (checkError) {
        console.error('Errore nel controllo del record:', checkError);
        throw checkError;
      }

      if (!existingRecord) {
        console.error('Record non trovato:', {
          impianto_id: entry.impianto_id,
          data: formattedDate,
          turno_id: entry.turno_id
        });
        throw new Error('Record non trovato');
      }

      console.log('Record trovato:', existingRecord);

      // Aggiorniamo il record specifico
      const { data, error } = await supabase
        .from('registro_turni_ordinari')
        .update({ 
          sostituto_id: sostitutoId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (error) {
        console.error('Errore Supabase nell\'aggiornamento:', error);
        throw error;
      }

      console.log('Risultato aggiornamento:', data);

      // Aggiorna l'entry locale
      const updatedEntries = [...entries];
      updatedEntries[selectedSostituto] = {
        ...entry,
        sostituto_id: sostitutoId || undefined
      };
      setEntries(updatedEntries);

      // Ricarica i dati per assicurarsi che tutto sia sincronizzato
      if (selectedMansioneId) {
        const newData = await getBrogliaccioEntries(selectedDate, selectedMansioneId);
        setEntries(newData);
      }

    } catch (error) {
      console.error('Errore completo:', error);
      alert('Si è verificato un errore durante l\'aggiornamento del sostituto. Riprova più tardi.');
    } finally {
      setSelectedSostituto(null);
    }
  };

  // Dividi le entries in due parti per le due colonne
  const midPoint = Math.ceil(entries.length / 2);
  const leftEntries = entries.slice(0, midPoint);
  const rightEntries = entries.slice(midPoint);

  const TableHeader = () => (
    <tr>
      <th scope="col" className="w-16 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Fono
      </th>
      <th scope="col" className="w-48 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Impianto
      </th>
      <th scope="col" className="w-48 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Agente Assente
      </th>
      <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Assenza
      </th>
      <th scope="col" className="w-16 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Turno
      </th>
      <th scope="col" className="w-20 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Prest.
      </th>
      <th scope="col" className="w-48 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Sostituto
      </th>
      <th scope="col" className="w-16 px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-b from-gray-50 to-gray-100">
        Conf.
      </th>
    </tr>
  );

  const TableBody = ({ entries, startIndex }: { entries: BrogliaccioEntry[], startIndex: number }) => (
    <>
      {loading ? (
        <tr>
          <td colSpan={8} className="px-2 py-4 text-center text-sm font-medium text-gray-700">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Caricamento...</span>
            </div>
          </td>
        </tr>
      ) : entries.length === 0 ? (
        <tr>
          <td colSpan={8} className="px-2 py-4 text-center text-sm font-medium text-gray-700">
            Nessun turno scoperto
          </td>
        </tr>
      ) : (
        entries.map((entry, index) => {
          const globalIndex = startIndex + index;
          const isConfirmed = confirmedRows.has(globalIndex);
          return (
            <tr 
              key={index} 
              className={`transition-colors duration-150 ${
                isConfirmed 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'hover:bg-blue-50'
              }`}
            >
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">-</td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.impianto}</td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.agente_assente}</td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.tipo_assenza}</td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.turno}</td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {entry.is_non_ordinario ? (
                  <div className="relative">
                    <span className="text-gray-400">-</span>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-0.5 bg-gray-400"></div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={(e) => handlePrestazioneClick(globalIndex, e)}
                      className={`w-full text-left px-2 py-1 rounded ${
                        entry.prestazione_sostituto
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {getPrestazioneCode(entry.prestazione_sostituto)}
                    </button>
                    {selectedPrestazione === globalIndex && (
                      <div 
                        ref={menuRef} 
                        className="fixed w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                        style={{
                          top: `${menuPosition.top}px`,
                          left: `${menuPosition.left}px`
                        }}
                      >
                        <div className="py-1">
                          {entry.prestazione_sostituto && (
                            <button
                              onClick={() => handlePrestazioneSelect(null)}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-b border-gray-100"
                            >
                              Rimuovi
                            </button>
                          )}
                          <button
                            onClick={() => handlePrestazioneSelect('cambio_turno')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Cambio turno
                          </button>
                          <button
                            onClick={() => handlePrestazioneSelect('disponibilita')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Disponibilità
                          </button>
                          <button
                            onClick={() => handlePrestazioneSelect('doppio_turno')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Doppio turno
                          </button>
                          <button
                            onClick={() => handlePrestazioneSelect('doppio_rc')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Doppio RC
                          </button>
                          <button
                            onClick={() => handlePrestazioneSelect('mancato_riposo_compensativo')}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Mancato riposo compensativo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {entry.is_non_ordinario ? (
                  <div className="relative">
                    <span className="text-gray-400">-</span>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-0.5 bg-gray-400"></div>
                    </div>
                  </div>
                ) : entry.prestazione_sostituto === 'disponibilita' ? (
                  <div className="relative">
                    <button
                      onClick={(e) => handleSostitutoClick(globalIndex, e)}
                      className={`w-full text-left px-2 py-1 rounded ${
                        entry.sostituto_id
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {entry.sostituto || 'Seleziona'}
                    </button>
                    {selectedSostituto === globalIndex && (
                      <div 
                        ref={menuRef} 
                        className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto min-w-[300px]"
                        style={{
                          top: `${menuPosition.top}px`,
                          left: `${menuPosition.left}px`
                        }}
                      >
                        {isLoadingAgenti ? (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            Caricamento...
                          </div>
                        ) : (
                          <div className="py-1">
                            {entry.sostituto_id && (
                              <button
                                onClick={() => handleSostitutoSelect(null)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-b border-gray-100"
                              >
                                Rimuovi
                              </button>
                            )}
                            {agentiDisponibili.length === 0 ? (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                Nessun agente disponibile
                              </div>
                            ) : (
                              agentiDisponibili.map(agente => (
                                <button
                                  key={agente.id}
                                  onClick={() => handleSostitutoSelect(agente.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap"
                                >
                                  {agente.cognome} {agente.nome} ({agente.impianto})
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : '-'}
              </td>
              <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                <input 
                  type="checkbox" 
                  className={`h-4 w-4 rounded cursor-pointer transition-colors duration-150 ${
                    isConfirmed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'text-blue-600 focus:ring-blue-500 border-gray-300 hover:border-blue-500'
                  }`}
                  checked={isConfirmed}
                  onChange={() => !entry.is_non_ordinario && handleConfirmation(globalIndex)}
                  readOnly={entry.is_non_ordinario}
                />
              </td>
            </tr>
          );
        })
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg shadow-md border border-blue-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📋</span>
          Brogliaccio
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Data di riferimento:</span>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && onDateChange(date)}
            dateFormat="dd/MM/yyyy"
            locale={it}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-blue-400 transition-colors duration-150"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {/* Colonna sinistra */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <TableHeader />
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <TableBody entries={leftEntries} startIndex={0} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Linea centrale che simula la rilegatura */}
        <div className="w-2 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 rounded-full shadow-inner"></div>

        {/* Colonna destra */}
        <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <TableHeader />
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <TableBody entries={rightEntries} startIndex={midPoint} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 