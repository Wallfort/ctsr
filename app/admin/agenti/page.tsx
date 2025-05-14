'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { agentiService, type Agente } from '@/lib/services/agenti.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';

export default function AgentiPage() {
  const [agenti, setAgenti] = useState<Agente[]>([]);
  const [mansioni, setMansioni] = useState<Mansione[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgente, setEditingAgente] = useState<Agente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    mansione_id: '',
    matricola: '',
    telefono1: '',
    telefono2: '',
    telefono3: ''
  });

  // Carica gli agenti e le mansioni all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [agentiData, mansioniData] = await Promise.all([
        agentiService.getAll(),
        mansioniService.getAll()
      ]);
      setAgenti(agentiData);
      setMansioni(mansioniData);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei dati:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (agente: Agente) => {
    setEditingAgente(agente);
    setFormData({
      nome: agente.nome,
      cognome: agente.cognome,
      mansione_id: agente.mansione_id?.toString() || '',
      matricola: agente.matricola.toString(),
      telefono1: agente.telefono1 || '',
      telefono2: agente.telefono2 || '',
      telefono3: agente.telefono3 || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo agente?')) {
      try {
        await agentiService.delete(id);
        await loadData();
        setError(null);
      } catch (err) {
        console.error('Errore nell\'eliminazione dell\'agente:', err);
        setError('Errore nell\'eliminazione dell\'agente');
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const agenteData = {
        nome: formData.nome,
        cognome: formData.cognome,
        mansione_id: formData.mansione_id ? parseInt(formData.mansione_id) : null,
        matricola: parseInt(formData.matricola),
        telefono1: formData.telefono1 || null,
        telefono2: formData.telefono2 || null,
        telefono3: formData.telefono3 || null
      };

      if (editingAgente) {
        await agentiService.update(editingAgente.id, agenteData);
      } else {
        await agentiService.create(agenteData);
      }
      await loadData();
      setIsModalOpen(false);
      setEditingAgente(null);
      setFormData({
        nome: '',
        cognome: '',
        mansione_id: '',
        matricola: '',
        telefono1: '',
        telefono2: '',
        telefono3: ''
      });
    } catch (err) {
      console.error('Errore nel salvataggio dell\'agente:', err);
      setError(`Errore nel salvataggio dell'agente: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestione Agenti</h1>
        <button
          onClick={() => {
            setEditingAgente(null);
            setFormData({
              nome: '',
              cognome: '',
              mansione_id: '',
              matricola: '',
              telefono1: '',
              telefono2: '',
              telefono3: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuovo Agente
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabella degli agenti */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matricola
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cognome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mansione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefono
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
            ) : agenti.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Nessun agente presente. Clicca su "Nuovo Agente" per aggiungerne uno.
                </td>
              </tr>
            ) : (
              agenti.map((agente) => (
                <tr key={agente.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">{agente.matricola}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agente.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agente.cognome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {mansioni.find(m => m.id === agente.mansione_id)?.nome || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {agente.telefono1 || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(agente)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(agente.id)}
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

      {/* Modal per creare/modificare agente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAgente ? 'Modifica Agente' : 'Nuovo Agente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="matricola" className="block text-sm font-medium text-gray-700">
                  Matricola
                </label>
                <input
                  type="number"
                  id="matricola"
                  value={formData.matricola}
                  onChange={(e) => handleInputChange('matricola', e.target.value)}
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
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">
                  Cognome
                </label>
                <input
                  type="text"
                  id="cognome"
                  value={formData.cognome}
                  onChange={(e) => handleInputChange('cognome', e.target.value)}
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
                  value={formData.mansione_id}
                  onChange={(e) => handleInputChange('mansione_id', e.target.value)}
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
                <label htmlFor="telefono1" className="block text-sm font-medium text-gray-700">
                  Telefono 1
                </label>
                <input
                  type="tel"
                  id="telefono1"
                  value={formData.telefono1}
                  onChange={(e) => handleInputChange('telefono1', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="telefono2" className="block text-sm font-medium text-gray-700">
                  Telefono 2
                </label>
                <input
                  type="tel"
                  id="telefono2"
                  value={formData.telefono2}
                  onChange={(e) => handleInputChange('telefono2', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="telefono3" className="block text-sm font-medium text-gray-700">
                  Telefono 3
                </label>
                <input
                  type="tel"
                  id="telefono3"
                  value={formData.telefono3}
                  onChange={(e) => handleInputChange('telefono3', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAgente(null);
                    setFormData({
                      nome: '',
                      cognome: '',
                      mansione_id: '',
                      matricola: '',
                      telefono1: '',
                      telefono2: '',
                      telefono3: ''
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
                  {editingAgente ? 'Salva Modifiche' : 'Crea Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 