'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';

export default function ImpiantiPage() {
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [mansioni, setMansioni] = useState<Mansione[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImpianto, setEditingImpianto] = useState<Impianto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica gli impianti e le mansioni all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [impiantiData, mansioniData] = await Promise.all([
        impiantiService.getAll(),
        mansioniService.getAll()
      ]);
      setImpianti(impiantiData);
      setMansioni(mansioniData);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (impianto: Impianto) => {
    setEditingImpianto(impianto);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo impianto?')) {
      try {
        await impiantiService.delete(id);
        await loadData();
        setError(null);
      } catch (err) {
        console.error('Errore nell\'eliminazione dell\'impianto:', err);
        setError('Errore nell\'eliminazione dell\'impianto');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const nome = formData.get('nome') as string;
    const mansione_id = parseInt(formData.get('mansione_id') as string);
    const nr_turni = parseInt(formData.get('nr_turni') as string);
    const stato = formData.get('stato') as 'attivo' | 'inattivo';

    try {
      if (editingImpianto) {
        // Modifica impianto esistente
        await impiantiService.update(editingImpianto.id, { nome, mansione_id, nr_turni, stato });
      } else {
        // Crea nuovo impianto
        await impiantiService.create({ nome, mansione_id, nr_turni, stato });
      }
      await loadData();
      setIsModalOpen(false);
      setEditingImpianto(null);
      form.reset();
    } catch (err) {
      console.error('Errore nel salvataggio dell\'impianto:', err);
      setError(`Errore nel salvataggio dell'impianto: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Impianti</h1>
        <button
          onClick={() => {
            setEditingImpianto(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuovo Impianto
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabella degli impianti */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mansione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Numero Turni
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Caricamento...
                </td>
              </tr>
            ) : impianti.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nessun impianto presente. Clicca su "Nuovo Impianto" per aggiungerne uno.
                </td>
              </tr>
            ) : (
              impianti.map((impianto) => (
                <tr key={impianto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{impianto.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mansioni.find(m => m.id === impianto.mansione_id)?.nome || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{impianto.nr_turni}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      impianto.stato === 'attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {impianto.stato}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(impianto)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(impianto.id)}
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

      {/* Modal per creare/modificare impianto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingImpianto ? 'Modifica Impianto' : 'Nuovo Impianto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  defaultValue={editingImpianto?.nome}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="mansione_id" className="block text-sm font-medium text-gray-700">
                  Mansione
                </label>
                <select
                  id="mansione_id"
                  name="mansione_id"
                  defaultValue={editingImpianto?.mansione_id}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleziona una mansione</option>
                  {mansioni.map((mansione) => (
                    <option key={mansione.id} value={mansione.id}>
                      {mansione.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nr_turni" className="block text-sm font-medium text-gray-700">
                  Numero Turni
                </label>
                <input
                  type="number"
                  id="nr_turni"
                  name="nr_turni"
                  min="0"
                  defaultValue={editingImpianto?.nr_turni || 0}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="stato" className="block text-sm font-medium text-gray-700">
                  Stato
                </label>
                <select
                  id="stato"
                  name="stato"
                  defaultValue={editingImpianto?.stato || 'attivo'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="attivo">Attivo</option>
                  <option value="inattivo">Inattivo</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingImpianto(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editingImpianto ? 'Salva Modifiche' : 'Crea Impianto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 