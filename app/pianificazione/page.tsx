'use client';

import { useState, useEffect } from 'react';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { righelliService, type Righello } from '@/lib/services/righelli.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';
import { PianificazioneService } from '@/lib/services/pianificazione.service';
import { useSelector } from '@/lib/context/selector-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImpiantoWithRighello = Impianto & {
  righelloAttivo?: Righello;
  mansione?: Mansione;
};

export default function PianificazionePage() {
  const { selectedSection } = useSelector();
  const [impianti, setImpianti] = useState<ImpiantoWithRighello[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataInizio, setDataInizio] = useState<string>('');
  const [dataFine, setDataFine] = useState<string>('');
  const [isPianificando, setIsPianificando] = useState(false);

  const pianificazioneService = new PianificazioneService();

  useEffect(() => {
    loadData();
  }, [selectedSection]);

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

      // Combina i dati
      const impiantiWithRighello = impiantiData
        .filter(impianto => {
          const mansione = mansioniData.find(m => m.id === impianto.mansione_id);
          // Filtra in base al nome della mansione
          return mansione?.nome.toLowerCase().includes(selectedSection.toLowerCase());
        })
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

  const handlePianificazione = async () => {
    if (!dataInizio || !dataFine) {
      setError('Seleziona le date di inizio e fine pianificazione');
      return;
    }
    if (new Date(dataInizio) > new Date(dataFine)) {
      setError('La data di inizio deve essere precedente alla data di fine');
      return;
    }

    try {
      setIsPianificando(true);
      setError(null);

      // Per ogni impianto con righello attivo, pianifica i turni
      for (const impianto of impianti) {
        if (!impianto.righelloAttivo) continue;

        await pianificazioneService.pianifica({
          dataInizio: new Date(dataInizio),
          dataFine: new Date(dataFine),
          selettore: selectedSection as 'stazioni' | 'impianti',
          elementoId: impianto.id
        });
      }

      // Ricarica i dati per mostrare eventuali aggiornamenti
      await loadData();
    } catch (err) {
      console.error('Errore durante la pianificazione:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la pianificazione');
    } finally {
      setIsPianificando(false);
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
        <h1 className="text-2xl font-bold">Pianificazione - {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}</h1>
        
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
            onClick={handlePianificazione}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isPianificando}
          >
            {isPianificando ? 'Pianificazione in corso...' : 'Pianifica'}
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