'use client';

import { useState, useEffect } from 'react';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { righelliService, type Righello } from '@/lib/services/righelli.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';
import { PianificazioneService } from '@/lib/services/pianificazione.service';
import { useSelector } from '@/lib/context/selector-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { format, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';

type ImpiantoWithRighello = Impianto & {
  righelloAttivo?: Righello;
  mansione?: Mansione;
};

type PianificazioneParams = {
  dataInizio: Date;
  dataFine: Date;
  selettore: 'mansioni';
  elementoId: number;
};

export default function PianificazionePage() {
  const { selectedMansioneId } = useSelector();
  const [impianti, setImpianti] = useState<ImpiantoWithRighello[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMansioneNome, setSelectedMansioneNome] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dataInizio, setDataInizio] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dataFine, setDataFine] = useState<string>(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  const supabase = createClient();

  const pianificazioneService = new PianificazioneService();

  useEffect(() => {
    if (!selectedMansioneId) return;

    const loadMansione = async () => {
      const { data: mansione, error } = await supabase
        .from('mansioni')
        .select('nome')
        .eq('id', selectedMansioneId)
        .single();

      if (error) {
        console.error('Errore nel caricamento della mansione:', error);
        return;
      }

      setSelectedMansioneNome(mansione.nome);
    };

    loadMansione();
  }, [selectedMansioneId]);

  useEffect(() => {
    loadData();
  }, [selectedMansioneId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [impiantiData, righelliData, mansioniData] = await Promise.all([
        impiantiService.getAll(),
        righelliService.getAll(),
        mansioniService.getAll()
      ]);

      // Filtra i righelli attivi
      const righelliAttivi = righelliData.filter(r => r.stato === 'attivo');

      // Trova la mansione selezionata
      const selectedMansione = mansioniData.find(m => m.id === selectedMansioneId);
      setSelectedMansioneNome(selectedMansione?.nome || '');

      // Combina i dati
      const impiantiWithRighello = impiantiData
        .filter(impianto => impianto.mansione_id === selectedMansioneId)
        .map(impianto => {
          const righelloAttivo = righelliAttivi.find(r => r.impianto_id === impianto.id);
          const mansione = mansioniData.find(m => m.id === impianto.mansione_id);
          return {
            ...impianto,
            righelloAttivo,
            mansione
          };
        });

      setImpianti(impiantiWithRighello);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePianifica = async () => {
    if (!selectedMansioneId) {
      setError('Seleziona una mansione');
      return;
    }

    if (!dataInizio || !dataFine) {
      setError('Seleziona le date di inizio e fine pianificazione');
      return;
    }

    if (new Date(dataInizio) > new Date(dataFine)) {
      setError('La data di inizio deve essere precedente alla data di fine');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: PianificazioneParams = {
        dataInizio: new Date(dataInizio),
        dataFine: new Date(dataFine),
        selettore: 'mansioni',
        elementoId: selectedMansioneId
      };

      await pianificazioneService.pianifica(params);
      // Ricarica i dati dopo la pianificazione
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la pianificazione');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-500">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pianificazione - {selectedMansioneNome}</h1>
        
        <div className="flex items-center gap-2">
          <div>
            <label htmlFor="data_inizio" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              id="data_inizio"
              value={dataInizio}
              onChange={(e) => setDataInizio(e.target.value)}
              className="block w-[240px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="data_fine" className="block text-sm font-medium text-gray-700 mb-1">
              Data Fine
            </label>
            <input
              type="date"
              id="data_fine"
              value={dataFine}
              onChange={(e) => setDataFine(e.target.value)}
              className="block w-[240px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <Button 
            onClick={handlePianifica}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? 'Pianificazione in corso...' : 'Pianifica'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {impianti.map((impianto) => (
          <div
            key={impianto.id}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold">{impianto.nome}</h2>
                <p className="text-sm text-gray-600">{impianto.mansione?.nome || 'Nessuna mansione'}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                impianto.righelloAttivo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {impianto.righelloAttivo ? 'Righello attivo' : 'Nessun righello attivo'}
              </span>
            </div>

            {impianto.righelloAttivo && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Righello attivo:</h3>
                <div className="text-sm">
                  <p><span className="font-medium">Nome:</span> {impianto.righelloAttivo.nome}</p>
                  <p><span className="font-medium">Posizioni:</span> {impianto.righelloAttivo.posizioni}</p>
                  <p><span className="font-medium">Data inizio:</span> {new Date(impianto.righelloAttivo.data_inizio).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 