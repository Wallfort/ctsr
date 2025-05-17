'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type TipoAssenza = {
  id: string;
  codice: string;
  nome: string;
  is_disponibile: boolean;
  is_compensativo: boolean;
  is_riposo: boolean;
  possibile_dt: boolean;
  created_at: string;
  updated_at: string;
};

export default function AssenzePage() {
  const [tipiAssenza, setTipiAssenza] = useState<TipoAssenza[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoAssenza | null>(null);
  const [codice, setCodice] = useState('');
  const [nome, setNome] = useState('');
  const [isDisponibile, setIsDisponibile] = useState(false);
  const [isCompensativo, setIsCompensativo] = useState(false);
  const [isRiposo, setIsRiposo] = useState(false);
  const [possibileDt, setPossibileDt] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadTipiAssenza();
  }, []);

  const loadTipiAssenza = async () => {
    const { data, error } = await supabase
      .from("tipi_assenza")
      .select("*")
      .order("codice");

    if (error) {
      console.error("Errore nel caricamento dei tipi di assenza:", error);
      return;
    }

    setTipiAssenza(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codice.trim() || !nome.trim()) {
      alert("Codice e nome sono obbligatori");
      return;
    }

    try {
      if (editingTipo) {
        // Modifica tipo esistente
        const { error } = await supabase
          .from("tipi_assenza")
          .update({ 
            codice, 
            nome,
            is_disponibile: isDisponibile,
            is_compensativo: isCompensativo,
            is_riposo: isRiposo,
            possibile_dt: possibileDt
          })
          .eq("id", editingTipo.id);

        if (error) throw error;
      } else {
        // Crea nuovo tipo
        const { error } = await supabase
          .from("tipi_assenza")
          .insert([{ 
            codice, 
            nome,
            is_disponibile: isDisponibile,
            is_compensativo: isCompensativo,
            is_riposo: isRiposo,
            possibile_dt: possibileDt
          }]);

        if (error) throw error;
      }

      await loadTipiAssenza();
      handleCloseModal();
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert("Errore nel salvataggio");
    }
  };

  const handleEdit = (tipo: TipoAssenza) => {
    setEditingTipo(tipo);
    setCodice(tipo.codice);
    setNome(tipo.nome);
    setIsDisponibile(tipo.is_disponibile);
    setIsCompensativo(tipo.is_compensativo);
    setIsRiposo(tipo.is_riposo);
    setPossibileDt(tipo.possibile_dt);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo tipo di assenza?")) return;

    try {
      const { error } = await supabase
        .from("tipi_assenza")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadTipiAssenza();
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      alert("Errore nell'eliminazione");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTipo(null);
    setCodice('');
    setNome('');
    setIsDisponibile(false);
    setIsCompensativo(false);
    setIsRiposo(false);
    setPossibileDt(false);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gestione Tipi di Assenza</h1>
      </div>

      <div className="mb-6">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Tipo di Assenza
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Disponibile
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compensativo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Riposo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Possibile DT
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tipiAssenza.map((tipo) => (
              <tr key={tipo.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tipo.codice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tipo.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tipo.is_disponibile ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tipo.is_compensativo ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tipo.is_riposo ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {tipo.possibile_dt ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => handleEdit(tipo)}
                  >
                    Modifica
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(tipo.id)}
                  >
                    Elimina
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTipo ? "Modifica Tipo di Assenza" : "Nuovo Tipo di Assenza"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Label htmlFor="codice">Codice *</Label>
                <Input
                  id="codice"
                  value={codice}
                  onChange={(e) => setCodice(e.target.value)}
                  placeholder="Inserisci il codice"
                  required
                />
              </div>
              <div className="mb-4">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Inserisci il nome"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDisponibile"
                    checked={isDisponibile}
                    onChange={(e) => setIsDisponibile(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isDisponibile">Disponibile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCompensativo"
                    checked={isCompensativo}
                    onChange={(e) => setIsCompensativo(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isCompensativo">Compensativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRiposo"
                    checked={isRiposo}
                    onChange={(e) => setIsRiposo(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isRiposo">Riposo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="possibileDt"
                    checked={possibileDt}
                    onChange={(e) => setPossibileDt(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="possibileDt">Possibile DT</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Annulla
                </Button>
                <Button type="submit">
                  {editingTipo ? "Salva Modifiche" : "Crea"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 