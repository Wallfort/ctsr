'use client';

import { useState, useEffect, Fragment } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { ciclicitaService, type Ciclicita, type TurnoCiclicita } from '@/lib/services/ciclicita.service';
import { turniService, type Turno } from '@/lib/services/turni.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';

export default function CiclicitaPage() {
  const [ciclicita, setCiclicita] = useState<Ciclicita[]>([]);
  const [turni, setTurni] = useState<Turno[]>([]);
  const [selectedCiclicita, setSelectedCiclicita] = useState<Ciclicita | null>(null);
  const [turniCiclicita, setTurniCiclicita] = useState<TurnoCiclicita[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTurniModalOpen, setIsTurniModalOpen] = useState(false);
  const [isRemoveTurnoModalOpen, setIsRemoveTurnoModalOpen] = useState(false);
  const [selectedTurnoCiclicita, setSelectedTurnoCiclicita] = useState<TurnoCiclicita | null>(null);
  const [editingCiclicita, setEditingCiclicita] = useState<Ciclicita | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: ''
  });

  // Carica le ciclicità e i turni all'avvio
  useEffect(() => {
    loadCiclicita();
    loadTurni();
  }, []);

  // Carica i turni della ciclicità selezionata
  useEffect(() => {
    if (selectedCiclicita) {
      loadTurniCiclicita(selectedCiclicita.id);
    }
  }, [selectedCiclicita]);

  const loadCiclicita = async () => {
    try {
      setIsLoading(true);
      const data = await ciclicitaService.getAll();
      setCiclicita(data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle ciclicità:', err);
      setError('Errore nel caricamento delle ciclicità');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTurni = async () => {
    try {
      const data = await turniService.getAll();
      setTurni(data);
    } catch (err) {
      console.error('Errore nel caricamento dei turni:', err);
      setError('Errore nel caricamento dei turni');
    }
  };

  const loadTurniCiclicita = async (ciclicitaId: string) => {
    try {
      const data = await ciclicitaService.getTurni(ciclicitaId);
      setTurniCiclicita(data);
    } catch (err) {
      console.error('Errore nel caricamento dei turni della ciclicità:', err);
      setError('Errore nel caricamento dei turni della ciclicità');
    }
  };

  const handleEdit = (ciclicita: Ciclicita) => {
    setEditingCiclicita(ciclicita);
    setFormData({
      nome: ciclicita.nome,
      descrizione: ciclicita.descrizione
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa ciclicità?')) {
      try {
        await ciclicitaService.delete(id);
        await loadCiclicita();
        if (selectedCiclicita?.id === id) {
          setSelectedCiclicita(null);
          setTurniCiclicita([]);
        }
        setError(null);
      } catch (err) {
        console.error('Errore nell\'eliminazione della ciclicità:', err);
        setError('Errore nell\'eliminazione della ciclicità');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingCiclicita) {
        await ciclicitaService.update(editingCiclicita.id, formData);
      } else {
        await ciclicitaService.create(formData);
      }
      await loadCiclicita();
      setIsModalOpen(false);
      setEditingCiclicita(null);
      setFormData({
        nome: '',
        descrizione: ''
      });
    } catch (err) {
      console.error('Errore nel salvataggio della ciclicità:', err);
      setError(`Errore nel salvataggio della ciclicità: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    }
  };

  const handleAddTurno = async (turnoId: number) => {
    if (!selectedCiclicita) return;

    try {
      const maxSequenza = Math.max(0, ...turniCiclicita.map(t => t.turno_sequenza));
      await ciclicitaService.addTurno({
        turno_id: turnoId,
        ciclicita_id: selectedCiclicita.id,
        turno_sequenza: maxSequenza + 1
      });
      await loadTurniCiclicita(selectedCiclicita.id);
    } catch (err) {
      console.error('Errore nell\'aggiunta del turno:', err);
      setError('Errore nell\'aggiunta del turno');
    }
  };

  const handleRemoveTurno = async (id: string) => {
    if (!selectedCiclicita) return;

    try {
      await ciclicitaService.removeTurno(id);
      await loadTurniCiclicita(selectedCiclicita.id);
    } catch (err) {
      console.error('Errore nella rimozione del turno:', err);
      setError('Errore nella rimozione del turno');
    }
  };

  const handleAddTurnoToSequence = async (turnoId: number, sequenza: number) => {
    if (!selectedCiclicita) return;

    try {
      await ciclicitaService.addTurno({
        turno_id: turnoId,
        ciclicita_id: selectedCiclicita.id,
        turno_sequenza: sequenza
      });
      await loadTurniCiclicita(selectedCiclicita.id);
    } catch (err) {
      console.error('Errore nell\'aggiunta del turno:', err);
      setError('Errore nell\'aggiunta del turno');
    }
  };

  const handleMoveTurno = async (id: string, direction: 'up' | 'down') => {
    if (!selectedCiclicita) return;

    const currentIndex = turniCiclicita.findIndex(t => t.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= turniCiclicita.length) return;

    try {
      // Scambia le sequenze
      const currentTurno = turniCiclicita[currentIndex];
      const targetTurno = turniCiclicita[newIndex];

      await Promise.all([
        ciclicitaService.updateTurnoSequenza(currentTurno.id, targetTurno.turno_sequenza),
        ciclicitaService.updateTurnoSequenza(targetTurno.id, currentTurno.turno_sequenza)
      ]);

      await loadTurniCiclicita(selectedCiclicita.id);
    } catch (err) {
      console.error('Errore nello spostamento del turno:', err);
      setError('Errore nello spostamento del turno');
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Rimuove i secondi
  };

  const calculateDuration = (start: string, end: string) => {
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Gestisce il caso in cui il turno passa la mezzanotte
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const isTurnoOrdinario = (nome: string) => {
    const nomeLower = nome.toLowerCase();
    return !nomeLower.includes('straordinario') && 
           !nomeLower.includes('festivo') && 
           !nomeLower.includes('notte') &&
           !nomeLower.includes('reperibilità');
  };

  const handleRemoveTurnoClick = (tc: TurnoCiclicita) => {
    setSelectedTurnoCiclicita(tc);
    setIsRemoveTurnoModalOpen(true);
  };

  const handleRemoveTurnoConfirm = async () => {
    if (!selectedTurnoCiclicita) return;
    await handleRemoveTurno(selectedTurnoCiclicita.id);
    setIsRemoveTurnoModalOpen(false);
    setSelectedTurnoCiclicita(null);
  };

  const handleReplaceTurno = async (newTurnoId: number) => {
    if (!selectedCiclicita) return;
    
    try {
      // Se abbiamo un turno esistente, lo rimuoviamo
      if (selectedTurnoCiclicita?.id) {
        await ciclicitaService.removeTurno(selectedTurnoCiclicita.id);
      }
      
      // Aggiungiamo il nuovo turno nella sequenza specificata
      await ciclicitaService.addTurno({
        turno_id: newTurnoId,
        ciclicita_id: selectedCiclicita.id,
        turno_sequenza: selectedTurnoCiclicita?.turno_sequenza || 1
      });
      
      await loadTurniCiclicita(selectedCiclicita.id);
      setIsRemoveTurnoModalOpen(false);
      setSelectedTurnoCiclicita(null);
    } catch (err) {
      console.error('Errore nella sostituzione del turno:', err);
      setError('Errore nella sostituzione del turno');
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Ciclicità</h1>
        <button
          onClick={() => {
            console.log('Pulsante Nuova Ciclicità cliccato');
            setEditingCiclicita(null);
            setFormData({
              nome: '',
              descrizione: ''
            });
            setIsModalOpen(true);
            console.log('isModalOpen impostato a:', true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuova Ciclicità
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Modal per creare/modificare ciclicità */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl mx-auto mb-6 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingCiclicita ? 'Modifica Ciclicità' : 'Nuova Ciclicità'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCiclicita(null);
                    setFormData({
                      nome: '',
                      descrizione: ''
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
                    Descrizione
                  </label>
                  <textarea
                    id="descrizione"
                    value={formData.descrizione}
                    onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                    rows={3}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingCiclicita(null);
                      setFormData({
                        nome: '',
                        descrizione: ''
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {editingCiclicita ? 'Salva Modifiche' : 'Crea Ciclicità'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-grow overflow-hidden relative">
        {/* Sidebar per aggiungere turni */}
        <AnimatePresence>
          {isTurniModalOpen && (
            <motion.div
              initial={{ x: -384 }}
              animate={{ x: 0 }}
              exit={{ x: -384 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-96 bg-white shadow-xl z-10"
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-bold">Aggiungi Turno</h2>
                  <button
                    onClick={() => setIsTurniModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                  {turni.map((turno) => (
                    <motion.div
                      key={turno.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer mb-2 transition-colors"
                      onClick={() => handleAddTurno(turno.id)}
                    >
                      <div className="text-center mb-2">
                        <div 
                          className="font-mono font-extrabold bg-gray-100 px-3 py-2 rounded inline-block"
                          style={{ fontSize: '1.75rem' }}
                        >
                          {turno.codice}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {turno.nome}
                        </div>
                      </div>
                      {turno.tipo === 'ordinario' && (
                        <div className="text-sm text-gray-500 text-center">
                          <div>{formatTime(turno.orario_inizio)} - {formatTime(turno.orario_fine)}</div>
                          <div className="mt-1 text-blue-600">
                            Durata: {calculateDuration(turno.orario_inizio, turno.orario_fine)}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenuto principale */}
        <motion.div
          animate={{
            marginLeft: isTurniModalOpen ? '384px' : '0px'
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="flex-grow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lista delle ciclicità */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Ciclicità</h2>
              </div>
              <div className="divide-y divide-gray-200 overflow-y-auto flex-grow">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Caricamento...
                  </div>
                ) : ciclicita.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nessuna ciclicità presente. Clicca su "Nuova Ciclicità" per aggiungerne una.
                  </div>
                ) : (
                  ciclicita.map((c) => (
                    <motion.div
                      key={c.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedCiclicita?.id === c.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedCiclicita(c)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{c.nome}</h3>
                          <p className="text-sm text-gray-500 mt-1">{c.descrizione}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(c);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(c.id);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Turni della ciclicità selezionata */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {selectedCiclicita ? `Turni di ${selectedCiclicita.nome}` : 'Seleziona una ciclicità'}
                </h2>
                {selectedCiclicita && (
                  <button
                    onClick={() => setIsTurniModalOpen(true)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Aggiungi Turno
                  </button>
                )}
              </div>
              <div className="flex-grow overflow-x-auto">
                {!selectedCiclicita ? (
                  <div className="p-4 text-center text-gray-500">
                    Seleziona una ciclicità per vedere i suoi turni
                  </div>
                ) : turniCiclicita.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nessun turno presente. Clicca su "Aggiungi Turno" per aggiungerne uno.
                  </div>
                ) : (
                  <div className="min-w-full inline-flex p-4 gap-4">
                    {/* Colonna delle etichette */}
                    <div className="flex-shrink-0 w-32 bg-gray-100 rounded-lg border border-gray-200 p-4 flex flex-col justify-between">
                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-gray-600">Sequenza</div>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-gray-600">Turno</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600">Orario</div>
                      </div>
                    </div>

                    {/* Colonna dei turni */}
                    {Array.from({ length: Math.max(...turniCiclicita.map(t => t.turno_sequenza)) }, (_, i) => i + 1).map((sequenza) => {
                      const tc = turniCiclicita.find(t => t.turno_sequenza === sequenza);
                      
                      return (
                        <motion.div
                          key={sequenza}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-shrink-0 w-48 bg-gray-50 rounded-lg border border-gray-200 p-4 relative group"
                        >
                          {/* Sequenza */}
                          <div className="text-center mb-3">
                            <div className="inline-block bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                              {sequenza}
                            </div>
                          </div>
                          
                          {tc ? (
                            <>
                              {/* Codice turno */}
                              <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                                <span style={{ fontSize: '2rem', fontWeight: 900, display: 'block' }}>{tc.turno?.codice}</span>
                              </div>
                              
                              {/* Orari */}
                              <div className="text-center text-sm text-gray-600">
                                <div>{formatTime(tc.turno?.orario_inizio || '')} - {formatTime(tc.turno?.orario_fine || '')}</div>
                              </div>
                              
                              {/* Barra delle azioni */}
                              <div className="mt-3 relative">
                                <button
                                  onClick={() => handleRemoveTurnoClick(tc)}
                                  className="w-full text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                                >
                                  Rimuovi turno
                                </button>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleMoveTurno(tc.id, 'up')}
                                    disabled={tc.turno_sequenza === 1}
                                    className={`p-1 rounded-full ${
                                      tc.turno_sequenza === 1 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    <ArrowUp size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleMoveTurno(tc.id, 'down')}
                                    disabled={tc.turno_sequenza === turniCiclicita.length}
                                    className={`p-1 rounded-full ${
                                      tc.turno_sequenza === turniCiclicita.length 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    <ArrowDown size={16} />
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)]">
                              <div className="text-gray-400 mb-3">Sequenza vuota</div>
                              <button
                                onClick={() => {
                                  setSelectedTurnoCiclicita({ id: '', turno_sequenza: sequenza } as TurnoCiclicita);
                                  setIsRemoveTurnoModalOpen(true);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                              >
                                Aggiungi turno
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modale rimuovi/sostituisci turno */}
      <AnimatePresence>
        {isRemoveTurnoModalOpen && selectedTurnoCiclicita && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedTurnoCiclicita.id ? 'Gestione Turno' : 'Aggiungi Turno'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsRemoveTurnoModalOpen(false);
                      setSelectedTurnoCiclicita(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {selectedTurnoCiclicita.id && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold mb-2">{selectedTurnoCiclicita.turno?.codice}</div>
                      <div className="text-sm text-gray-600">
                        {formatTime(selectedTurnoCiclicita.turno?.orario_inizio || '')} - {formatTime(selectedTurnoCiclicita.turno?.orario_fine || '')}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {selectedTurnoCiclicita.id && (
                      <button
                        onClick={handleRemoveTurnoConfirm}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Rimuovi turno
                      </button>
                    )}
                    
                    <div className="relative">
                      {selectedTurnoCiclicita.id && (
                        <div className="text-center text-sm text-gray-500 my-2">oppure</div>
                      )}
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {selectedTurnoCiclicita.id ? 'Sostituisci con:' : 'Seleziona un turno:'}
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {turni
                          .filter(t => !selectedTurnoCiclicita.id || t.id !== selectedTurnoCiclicita.turno?.id)
                          .map((turno) => (
                            <button
                              key={turno.id}
                              onClick={() => handleReplaceTurno(turno.id)}
                              className="w-full text-left p-2 hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <div className="font-medium">{turno.codice}</div>
                              <div className="text-sm text-gray-600">
                                {formatTime(turno.orario_inizio)} - {formatTime(turno.orario_fine)}
                              </div>
                            </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 