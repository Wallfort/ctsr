'use client';

import { useState, useEffect } from 'react';
import { impiantiService, type Impianto, type Linea } from '@/lib/services/impianti.service';
import { mansioniService, type Mansione } from '@/lib/services/mansioni.service';

export default function ImpiantiAdmin() {
  const [impianti, setImpianti] = useState<Impianto[]>([]);
  const [linee, setLinee] = useState<Linea[]>([]);
  const [mansioni, setMansioni] = useState<Mansione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingImpianto, setEditingImpianto] = useState<Impianto | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    linea_id: '',
    mansione_id: '',
    nr_turni: '0',
    stato: 'attivo' as 'attivo' | 'inattivo'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [impiantiData, lineeData, mansioniData] = await Promise.all([
        impiantiService.getAll(),
        impiantiService.getLinee(),
        mansioniService.getAll()
      ]);
      setImpianti(impiantiData);
      setLinee(lineeData);
      setMansioni(mansioniData);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento dei dati');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingImpianto) {
        const updated = await impiantiService.update(editingImpianto.id, {
          ...formData,
          linea_id: formData.linea_id ? parseInt(formData.linea_id) : null,
          mansione_id: parseInt(formData.mansione_id),
          nr_turni: parseInt(formData.nr_turni)
        });
        setImpianti(impianti.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await impiantiService.create({
          ...formData,
          linea_id: formData.linea_id ? parseInt(formData.linea_id) : null,
          mansione_id: parseInt(formData.mansione_id),
          nr_turni: parseInt(formData.nr_turni)
        });
        setImpianti([...impianti, created]);
      }
      resetForm();
    } catch (err) {
      setError('Errore nel salvataggio');
      console.error(err);
    }
  };

  const handleEdit = (impianto: Impianto) => {
    setEditingImpianto(impianto);
    setFormData({
      nome: impianto.nome,
      linea_id: impianto.linea_id?.toString() || '',
      mansione_id: impianto.mansione_id.toString(),
      nr_turni: impianto.nr_turni.toString(),
      stato: impianto.stato
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo impianto?')) {
      try {
        await impiantiService.delete(id);
        setImpianti(impianti.filter(i => i.id !== id));
      } catch (err) {
        setError('Errore nell\'eliminazione');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setEditingImpianto(null);
    setFormData({
      nome: '',
      linea_id: '',
      mansione_id: '',
      nr_turni: '0',
      stato: 'attivo' as 'attivo' | 'inattivo'
    });
  };

  if (loading) return <div>Caricamento...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestione Impianti</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingImpianto ? 'Modifica Impianto' : 'Nuovo Impianto'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Linea</label>
            <select
              value={formData.linea_id}
              onChange={(e) => setFormData({ ...formData, linea_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleziona una linea</option>
              {linee.map((linea) => (
                <option key={linea.id} value={linea.id}>
                  {linea.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mansione</label>
            <select
              value={formData.mansione_id}
              onChange={(e) => setFormData({ ...formData, mansione_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
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
            <label className="block text-sm font-medium text-gray-700">Numero Turni</label>
            <input
              type="number"
              min="0"
              value={formData.nr_turni}
              onChange={(e) => setFormData({ ...formData, nr_turni: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stato</label>
            <select
              value={formData.stato}
              onChange={(e) => setFormData({ ...formData, stato: e.target.value as 'attivo' | 'inattivo' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="attivo">Attivo</option>
              <option value="inattivo">Inattivo</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editingImpianto ? 'Aggiorna' : 'Crea'}
          </button>
          {editingImpianto && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Annulla
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linea</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mansione</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turni</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {impianti.map((impianto) => (
              <tr key={impianto.id}>
                <td className="px-6 py-4 whitespace-nowrap">{impianto.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {linee.find(l => l.id === impianto.linea_id)?.nome || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mansioni.find(m => m.id === impianto.mansione_id)?.nome || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{impianto.nr_turni}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    impianto.stato === 'attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {impianto.stato}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(impianto)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(impianto.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 