import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type TipoAssenza = Database['public']['Tables']['tipi_assenza']['Row'];

interface AssenzaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assenzaId: number) => void;
  onRemove: () => void;
  currentAssenzaId?: number;
}

export function AssenzaModal({ isOpen, onClose, onSave, onRemove, currentAssenzaId }: AssenzaModalProps) {
  const [tipiAssenza, setTipiAssenza] = useState<TipoAssenza[]>([]);
  const [selectedAssenzaId, setSelectedAssenzaId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTipiAssenza();
      if (currentAssenzaId) {
        setSelectedAssenzaId(currentAssenzaId);
      }
    }
  }, [isOpen, currentAssenzaId]);

  const loadTipiAssenza = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tipi_assenza')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Errore nel caricamento dei tipi di assenza:', error);
      return;
    }

    setTipiAssenza(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Gestione Assenza</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo Assenza
          </label>
          <select
            className="w-full p-2 border rounded"
            value={selectedAssenzaId}
            onChange={(e) => setSelectedAssenzaId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Seleziona un tipo di assenza</option>
            {tipiAssenza.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          {currentAssenzaId && (
            <button
              onClick={onRemove}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Rimuovi
            </button>
          )}
          <button
            onClick={() => onSave(Number(selectedAssenzaId))}
            disabled={!selectedAssenzaId || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Salvataggio...' : 'Salva'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
} 