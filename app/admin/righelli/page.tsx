'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { righelliService, type Righello } from '@/lib/services/righelli.service';
import { impiantiService, type Impianto } from '@/lib/services/impianti.service';
import Link from 'next/link';

export default function RighelliPage() {
  const [righelli, setRighelli] = useState<Righello[]>([]);
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRighello, setEditingRighello] = useState<Righello | null>(null);
  const [formData, setFormData] = useState<Omit<Righello, 'id' | 'created_at' | 'updated_at'>>({
    impianto_id: '',
    nome: '',
    posizioni: 1,
    data_inizio: '',
    stato: 'attivo'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [righelliData, impiantiData] = await Promise.all([
        righelliService.getAll(),
        impiantiService.getAll()
      ]);
      setRighelli(righelliData);
      setImpianti(impiantiData);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (righello: Righello) => {
    setEditingRighello(righello);
    setFormData({
      impianto_id: righello.impianto_id,
      nome: righello.nome,
      posizioni: righello.posizioni,
      data_inizio: righello.data_inizio.split('T')[0],
      stato: righello.stato
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo righello?')) return;

    try {
      await righelliService.delete(id);
      await loadData();
      setError(null);
    } catch (err) {
      console.error('Errore nell\'eliminazione del righello:', err);
      setError('Errore nell\'eliminazione del righello');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRighello) {
        await righelliService.update(editingRighello.id, formData);
      } else {
        await righelliService.create(formData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingRighello(null);
      setFormData({
        impianto_id: '',
        nome: '',
        posizioni: 1,
        data_inizio: '',
        stato: 'attivo'
      });
      setError(null);
    } catch (err) {
      console.error('Errore nel salvataggio del righello:', err);
      setError('Errore nel salvataggio del righello');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Righelli</h1>
        <button
          onClick={() => {
            setEditingRighello(null);
            setFormData({
              impianto_id: '',
              nome: '',
              posizioni: 1,
              data_inizio: '',
              stato: 'attivo'
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuovo Righello
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabella dei righelli */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impianto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Posizioni
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Inizio
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
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Caricamento...
                </td>
              </tr>
            ) : righelli.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nessun righello presente. Clicca su "Nuovo Righello" per aggiungerne uno.
                </td>
              </tr>
            ) : (
              righelli.map((righello) => (
                <tr key={righello.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{righello.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {impianti.find(i => i.id === righello.impianto_id)?.nome || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {righello.posizioni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(righello.data_inizio).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      righello.stato === 'attivo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {righello.stato}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(righello)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Modifica
                    </button>
                    <Link
                      href={`/admin/righelli/${righello.id}`}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Posizioni
                    </Link>
                    <button
                      onClick={() => handleDelete(righello.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal per creare/modificare righello */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRighello ? 'Modifica Righello' : 'Nuovo Righello'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="impianto_id" className="block text-sm font-medium text-gray-700">
                  Impianto
                </label>
                <select
                  id="impianto_id"
                  value={formData.impianto_id}
                  onChange={(e) => handleInputChange('impianto_id', e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Seleziona un impianto</option>
                  {impianti.map((impianto) => (
                    <option key={impianto.id} value={impianto.id}>
                      {impianto.nome}
                    </option>
                  ))}
                </select>
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
              <div>
                <label htmlFor="posizioni" className="block text-sm font-medium text-gray-700">
                  Numero Posizioni
                </label>
                <input
                  type="number"
                  id="posizioni"
                  value={formData.posizioni}
                  onChange={(e) => handleInputChange('posizioni', parseInt(e.target.value))}
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="data_inizio" className="block text-sm font-medium text-gray-700">
                  Data Inizio
                </label>
                <input
                  type="date"
                  id="data_inizio"
                  value={formData.data_inizio}
                  onChange={(e) => handleInputChange('data_inizio', e.target.value)}
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
                  value={formData.stato}
                  onChange={(e) => handleInputChange('stato', e.target.value as 'attivo' | 'inattivo')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="attivo">Attivo</option>
                  <option value="inattivo">Inattivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
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
                  {editingRighello ? 'Salva Modifiche' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 