'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, X, ArrowLeftRight } from 'lucide-react';
import { righelliService, type Righello } from '@/lib/services/righelli.service';
import { posizioniService, type Posizione } from '@/lib/services/posizioni.service';
import { ciclicitaService, type Ciclicita, type TurnoCiclicita } from '@/lib/services/ciclicita.service';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { agentiService, type Agente } from '@/lib/services/agenti.service';

type AgenteWithPosizione = Agente & {
  posizioneAttuale?: {
    impianto: string;
    posizione: number;
  };
};

export default function RighelloPosizioniPage() {
  const params = useParams();
  const router = useRouter();
  const righelloId = params.id as string;

  const [righello, setRighello] = useState<Righello | null>(null);
  const [posizioni, setPosizioni] = useState<Posizione[]>([]);
  const [ciclicita, setCiclicita] = useState<Ciclicita[]>([]);
  const [impianto, setImpianto] = useState<Impianto | null>(null);
  const [agenti, setAgenti] = useState<AgenteWithPosizione[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosizione, setSelectedPosizione] = useState<Posizione | null>(null);
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [swapSource, setSwapSource] = useState<Posizione | null>(null);
  const [formData, setFormData] = useState<{
    ciclicita_id: string;
    sequenza: number;
    agente_id: string | null;
  }>({
    ciclicita_id: '',
    sequenza: 1,
    agente_id: null
  });

  const [selectedCiclicita, setSelectedCiclicita] = useState<Ciclicita | null>(null);
  const [turniCiclicita, setTurniCiclicita] = useState<TurnoCiclicita[]>([]);

  useEffect(() => {
    loadData();
  }, [righelloId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [righelloData, posizioniData, ciclicitaData, agentiData] = await Promise.all([
        righelliService.getById(righelloId),
        posizioniService.getByRighello(righelloId),
        ciclicitaService.getAll(),
        agentiService.getAll()
      ]);
      setRighello(righelloData);
      setPosizioni(posizioniData);
      setCiclicita(ciclicitaData);

      // Carica le posizioni attuali degli agenti
      const agentiWithPosizioni = await Promise.all(
        agentiData.map(async (agente) => {
          const posizioniAgente = await posizioniService.getByAgente(agente.id);
          return {
            ...agente,
            posizioneAttuale: posizioniAgente[0] ? {
              impianto: posizioniAgente[0].righelli.impianti.nome,
              posizione: posizioniAgente[0].numero
            } : undefined
          };
        })
      );
      setAgenti(agentiWithPosizioni);

      if (righelloData) {
        const impiantoData = await impiantiService.getById(righelloData.impianto_id);
        setImpianto(impiantoData);
      }

      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPosizione = (posizione: Posizione) => {
    if (isSwapMode) {
      if (!swapSource) {
        setSwapSource(posizione);
      } else {
        handleSwapPosizioni(swapSource, posizione);
      }
      return;
    }

    setSelectedPosizione(posizione);
    setFormData({
      ciclicita_id: posizione.ciclicita_id || '',
      sequenza: posizione.sequenza,
      agente_id: posizione.agente_id
    });
    setIsModalOpen(true);
  };

  const handleSwapPosizioni = async (source: Posizione, target: Posizione) => {
    try {
      const sourceAgenteId = source.agente_id;
      const targetAgenteId = target.agente_id;

      // Aggiorna le posizioni
      await Promise.all([
        posizioniService.update(source.id, { agente_id: targetAgenteId }),
        posizioniService.update(target.id, { agente_id: sourceAgenteId })
      ]);

      // Resetta lo stato dello swap
      setIsSwapMode(false);
      setSwapSource(null);
      
      // Ricarica i dati
      await loadData();
    } catch (err) {
      console.error('Errore nello scambio delle posizioni:', err);
      setError('Errore nello scambio delle posizioni');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPosizione) return;

    try {
      // Se stiamo assegnando un nuovo agente
      if (formData.agente_id) {
        // Rimuovi l'agente dalla sua posizione precedente
        const posizioniAgente = await posizioniService.getByAgente(formData.agente_id);
        if (posizioniAgente.length > 0) {
          await posizioniService.update(posizioniAgente[0].id, { agente_id: null });
        }
      }

      // Aggiorna la posizione corrente
      await posizioniService.update(selectedPosizione.id, formData);
      await loadData();
      setIsModalOpen(false);
      setSelectedPosizione(null);
      setFormData({
        ciclicita_id: '',
        sequenza: 1,
        agente_id: null
      });
      setError(null);
    } catch (err) {
      console.error('Errore nel salvataggio della posizione:', err);
      setError('Errore nel salvataggio della posizione');
    }
  };

  const handleInputChange = async (field: keyof typeof formData, value: string | number | null) => {
    if (field === 'ciclicita_id') {
      const ciclicitaSelezionata = ciclicita.find(c => c.id === value);
      setSelectedCiclicita(ciclicitaSelezionata || null);
      if (ciclicitaSelezionata) {
        try {
          const turni = await ciclicitaService.getTurni(ciclicitaSelezionata.id);
          setTurniCiclicita(turni);
        } catch (err) {
          console.error('Errore nel recupero dei turni della ciclicità:', err);
          setError('Errore nel recupero dei turni della ciclicità');
        }
      } else {
        setTurniCiclicita([]);
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredAgenti = showOnlyUnassigned
    ? agenti.filter(agente => !agente.posizioneAttuale)
    : agenti;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-gray-500">Caricamento...</div>
      </div>
    );
  }

  if (!righello || !impianto) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">Righello non trovato</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Indietro
        </button>
        <h1 className="text-3xl font-bold mb-2">Posizioni del Righello</h1>
        <div className="text-gray-600">
          <p>Impianto: {impianto.nome}</p>
          <p>Nome Righello: {righello.nome}</p>
          <p>Data Inizio: {new Date(righello.data_inizio).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOnlyUnassigned}
            onChange={(e) => setShowOnlyUnassigned(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mostra solo agenti non assegnati
        </label>

        <button
          onClick={() => {
            setIsSwapMode(!isSwapMode);
            setSwapSource(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md ${
            isSwapMode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          {isSwapMode ? 'Annulla Scambio' : 'Scambia Posizioni'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isSwapMode && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          {swapSource
            ? `Seleziona la posizione con cui scambiare la Posizione ${swapSource.numero}`
            : 'Seleziona la prima posizione da scambiare'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posizioni.map((posizione) => (
          <div
            key={posizione.id}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${
              isSwapMode && swapSource?.id === posizione.id
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
            onClick={() => handleEditPosizione(posizione)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Posizione {posizione.numero}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                posizione.ciclicita_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {posizione.ciclicita_id ? 'Configurata' : 'Non configurata'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {posizione.agente_id ? (
                <div className="flex items-center justify-between">
                  <p>Agente: {agenti.find(a => a.id === posizione.agente_id)?.nome} {agenti.find(a => a.id === posizione.agente_id)?.cognome}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPosizione({ ...posizione, agente_id: null });
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Rimuovi agente"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-red-500 font-medium">TURNO VACANTE</p>
              )}
              {posizione.ciclicita_id && (
                <>
                  <p>Ciclicità: {ciclicita.find(c => c.id === posizione.ciclicita_id)?.nome}</p>
                  <p>Sequenza: {posizione.sequenza}</p>
                  <div className="mt-2">
                    <div className="relative group">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInputChange('sequenza', (posizione.sequenza % turniCiclicita.length) + 1);
                        }}
                      >
                        Cambia sequenza
                      </button>
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-300 z-50 pointer-events-none">
                        <div className="p-3">
                          <h4 className="font-medium mb-2">Turni della sequenza:</h4>
                          <div className="space-y-1">
                            {turniCiclicita.map((turno, index) => (
                              <div
                                key={turno.id}
                                className={`p-2 rounded ${
                                  index + 1 === formData.sequenza
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                {turno.turno?.nome} ({turno.turno?.orario_inizio} - {turno.turno?.orario_fine})
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal per modificare la posizione */}
      {isModalOpen && selectedPosizione && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Modifica Posizione {selectedPosizione.numero}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="agente_id" className="block text-sm font-medium text-gray-700">
                  Agente
                </label>
                <select
                  id="agente_id"
                  value={formData.agente_id || ''}
                  onChange={(e) => handleInputChange('agente_id', e.target.value || null)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleziona un agente</option>
                  {filteredAgenti.map((agente) => (
                    <option
                      key={agente.id}
                      value={agente.id}
                      className={agente.posizioneAttuale ? 'text-blue-600 font-medium' : ''}
                    >
                      {agente.nome} {agente.cognome}
                      {agente.posizioneAttuale && ` (${agente.posizioneAttuale.impianto} - Pos. ${agente.posizioneAttuale.posizione})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ciclicita_id" className="block text-sm font-medium text-gray-700">
                  Ciclicità
                </label>
                <select
                  id="ciclicita_id"
                  value={formData.ciclicita_id}
                  onChange={(e) => handleInputChange('ciclicita_id', e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleziona una ciclicità</option>
                  {ciclicita.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCiclicita && turniCiclicita.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sequenza della Ciclicità
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {turniCiclicita.map((turnoCiclicita, index) => (
                      <div key={turnoCiclicita.id} className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleInputChange('sequenza', index + 1)}
                          className={`p-2 text-sm rounded-md border w-full ${
                            formData.sequenza === index + 1
                              ? 'bg-green-500 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {turnoCiclicita.turno?.codice || 'N/A'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Seleziona il turno iniziale dalla sequenza sopra
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 