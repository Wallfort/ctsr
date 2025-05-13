'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';

export default function MansioniPage() {
  const [mansioni, setMansioni] = useState<Mansione[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMansione, setEditingMansione] = useState<Mansione | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica le mansioni all'avvio
  useEffect(() => {
    loadMansioni();
  }, []);

  const loadMansioni = async () => {
    try {
      setIsLoading(true);
      const data = await mansioniService.getAll();
      setMansioni(data);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento delle mansioni:', err);
      setError('Errore nel caricamento delle mansioni');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mansione: Mansione) => {
    setEditingMansione(mansione);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Sei sicuro di voler eliminare questa mansione?')) {
      try {
        await mansioniService.delete(id);
        await loadMansioni();
        setError(null);
      } catch (err) {
        console.error('Errore nell\'eliminazione della mansione:', err);
        setError('Errore nell\'eliminazione della mansione');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const nome = formData.get('nome') as string;
    const stato = formData.get('stato') as 'attivo' | 'inattivo';

    try {
      if (editingMansione) {
        // Modifica mansione esistente
        await mansioniService.update(editingMansione.id, { nome, stato });
      } else {
        // Crea nuova mansione
        await mansioniService.create({ nome, stato });
      }
      await loadMansioni();
      setIsModalOpen(false);
      setEditingMansione(null);
      form.reset();
    } catch (err) {
      console.error('Errore nel salvataggio della mansione:', err);
      setError(`Errore nel salvataggio della mansione: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Mansioni</h1>
        <button
          onClick={() => {
            setEditingMansione(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuova Mansione
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabella delle mansioni */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
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
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Caricamento...
                </td>
              </tr>
            ) : mansioni.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Nessuna mansione presente. Clicca su "Nuova Mansione" per aggiungerne una.
                </td>
              </tr>
            ) : (
              mansioni.map((mansione) => (
                <tr key={mansione.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mansione.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      mansione.stato === 'attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {mansione.stato}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(mansione)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(mansione.id)}
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

      {/* Modal per creare/modificare mansione */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMansione ? 'Modifica Mansione' : 'Nuova Mansione'}
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
                  defaultValue={editingMansione?.nome}
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
                  defaultValue={editingMansione?.stato || 'attivo'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="attivo">Attivo</option>
                  <option value="inattivo">Inattivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingMansione(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  {editingMansione ? 'Salva Modifiche' : 'Crea Mansione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 