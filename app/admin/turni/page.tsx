'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { turniService, type Turno } from '@/lib/services/turni.service';

// Funzione per calcolare la durata in minuti tra due orari
function calculateDuration(start: string, end: string): number {
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  
  let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  if (duration < 0) {
    duration += 24 * 60; // Aggiungi 24 ore se l'orario di fine è nel giorno successivo
  }
  return duration;
}

// Funzione per formattare i minuti in ore e minuti
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// Funzione per formattare l'orario (rimuove i secondi)
function formatTime(time: string): string {
  return time.substring(0, 5);
}

export default function TurniPage() {
  const [turni, setTurni] = useState<Turno[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codice: '',
    nome: '',
    orario_inizio: '',
    orario_fine: '',
    durata_minuti: 0,
    tipo: 'ordinario' as Turno['tipo'],
    descrizione: ''
  });

  // Carica i turni all'avvio
  useEffect(() => {
    loadTurni();
  }, []);

  const loadTurni = async () => {
    try {
      setIsLoading(true);
      const data = await turniService.getAll();
      setTurni(data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei turni:', err);
      setError('Errore nel caricamento dei turni');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (turno: Turno) => {
    setEditingTurno(turno);
    setFormData({
      codice: turno.codice,
      nome: turno.nome,
      orario_inizio: turno.orario_inizio,
      orario_fine: turno.orario_fine,
      durata_minuti: turno.durata_minuti,
      tipo: turno.tipo,
      descrizione: turno.descrizione
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Sei sicuro di voler eliminare questo turno?')) {
      try {
        await turniService.delete(id);
        await loadTurni();
        setError(null);
      } catch (err) {
        console.error('Errore nell\'eliminazione del turno:', err);
        setError('Errore nell\'eliminazione del turno');
      }
    }
  };

  const handleTimeChange = (field: 'orario_inizio' | 'orario_fine', value: string) => {
    const newFormData = { ...formData, [field]: value };
    if (newFormData.orario_inizio && newFormData.orario_fine) {
      newFormData.durata_minuti = calculateDuration(newFormData.orario_inizio, newFormData.orario_fine);
    }
    setFormData(newFormData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'tipo') {
      const newTipo = value as Turno['tipo'];
      // Se il tipo è compensativo o riposo, imposta gli orari per l'intera giornata
      if (newTipo === 'compensativo' || newTipo === 'riposo') {
        setFormData(prev => ({
          ...prev,
          tipo: newTipo,
          orario_inizio: '00:00',
          orario_fine: '23:59',
          durata_minuti: 24 * 60 - 1 // 23:59 - 00:00 = 23 ore e 59 minuti
        }));
      } else {
        setFormData(prev => ({ ...prev, tipo: newTipo }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingTurno) {
        // Modifica turno esistente
        await turniService.update(editingTurno.id, { 
          codice: formData.codice, 
          nome: formData.nome, 
          orario_inizio: formData.orario_inizio, 
          orario_fine: formData.orario_fine, 
          durata_minuti: formData.durata_minuti, 
          tipo: formData.tipo,
          descrizione: formData.descrizione
        });
      } else {
        // Crea nuovo turno
        await turniService.create({ 
          codice: formData.codice, 
          nome: formData.nome, 
          orario_inizio: formData.orario_inizio, 
          orario_fine: formData.orario_fine, 
          durata_minuti: formData.durata_minuti, 
          tipo: formData.tipo,
          descrizione: formData.descrizione
        });
      }
      await loadTurni();
      setIsModalOpen(false);
      setEditingTurno(null);
      setFormData({
        codice: '',
        nome: '',
        orario_inizio: '',
        orario_fine: '',
        durata_minuti: 0,
        tipo: 'ordinario',
        descrizione: ''
      });
    } catch (err) {
      console.error('Errore nel salvataggio del turno:', err);
      setError(`Errore nel salvataggio del turno: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Turni</h1>
        <button
          onClick={() => {
            setEditingTurno(null);
            setFormData({
              codice: '',
              nome: '',
              orario_inizio: '',
              orario_fine: '',
              durata_minuti: 0,
              tipo: 'ordinario',
              descrizione: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuovo Turno
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabella dei turni */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durata
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Caricamento...
                </td>
              </tr>
            ) : turni.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Nessun turno presente. Clicca su "Nuovo Turno" per aggiungerne uno.
                </td>
              </tr>
            ) : (
              turni.map((turno) => (
                <tr key={turno.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{turno.codice}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{turno.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTime(turno.orario_inizio)} - {formatTime(turno.orario_fine)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDuration(turno.durata_minuti)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      turno.tipo === 'ordinario' ? 'bg-blue-100 text-blue-800' :
                      turno.tipo === 'compensativo' ? 'bg-yellow-100 text-yellow-800' :
                      turno.tipo === 'disponibilita' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {turno.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {turno.descrizione || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(turno)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(turno.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal per creare/modificare turno */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTurno ? 'Modifica Turno' : 'Nuovo Turno'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
                  Codice
                </label>
                <input
                  type="text"
                  id="codice"
                  value={formData.codice}
                  onChange={(e) => handleInputChange('codice', e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="orario_inizio" className="block text-sm font-medium text-gray-700">
                    Orario Inizio
                  </label>
                  <input
                    type="time"
                    id="orario_inizio"
                    value={formData.orario_inizio}
                    onChange={(e) => handleTimeChange('orario_inizio', e.target.value)}
                    required
                    disabled={formData.tipo === 'compensativo' || formData.tipo === 'riposo'}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      (formData.tipo === 'compensativo' || formData.tipo === 'riposo') ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="orario_fine" className="block text-sm font-medium text-gray-700">
                    Orario Fine
                  </label>
                  <input
                    type="time"
                    id="orario_fine"
                    value={formData.orario_fine}
                    onChange={(e) => handleTimeChange('orario_fine', e.target.value)}
                    required
                    disabled={formData.tipo === 'compensativo' || formData.tipo === 'riposo'}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      (formData.tipo === 'compensativo' || formData.tipo === 'riposo') ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Durata
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {formData.durata_minuti > 0 ? formatDuration(formData.durata_minuti) : 'Seleziona gli orari'}
                </div>
              </div>
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value as Turno['tipo'])}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="ordinario">Ordinario</option>
                  <option value="compensativo">Compensativo</option>
                  <option value="disponibilita">Disponibilità</option>
                  <option value="riposo">Riposo</option>
                </select>
              </div>
              <div>
                <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  id="descrizione"
                  value={formData.descrizione}
                  onChange={(e) => handleInputChange('descrizione', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTurno(null);
                    setFormData({
                      codice: '',
                      nome: '',
                      orario_inizio: '',
                      orario_fine: '',
                      durata_minuti: 0,
                      tipo: 'ordinario',
                      descrizione: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editingTurno ? 'Salva Modifiche' : 'Crea Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 