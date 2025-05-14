import { createClient } from '@/lib/supabase/client';

export type Impianto = {
  id: string;
  nome: string;
  mansione_id: number;
  nr_turni: number;
  stato: 'attivo' | 'inattivo';
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const impiantiService = {
  async getAll(): Promise<Impianto[]> {
    const { data, error } = await supabase
      .from('impianti')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Errore nel recupero degli impianti:', error);
      throw new Error(`Errore nel recupero degli impianti: ${error.message}`);
    }
    return data || [];
  },

  async create(impianto: Omit<Impianto, 'id' | 'created_at' | 'updated_at'>): Promise<Impianto> {
    const { data, error } = await supabase
      .from('impianti')
      .insert([impianto])
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione dell\'impianto:', error);
      throw new Error(`Errore nella creazione dell'impianto: ${error.message}`);
    }
    return data;
  },

  async update(id: string, impianto: Partial<Omit<Impianto, 'id' | 'created_at' | 'updated_at'>>): Promise<Impianto> {
    const { data, error } = await supabase
      .from('impianti')
      .update(impianto)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento dell\'impianto:', error);
      throw new Error(`Errore nell'aggiornamento dell'impianto: ${error.message}`);
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('impianti')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione dell\'impianto:', error);
      throw new Error(`Errore nell'eliminazione dell'impianto: ${error.message}`);
    }
  }
}; 