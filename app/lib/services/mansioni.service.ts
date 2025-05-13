import { createClient } from '@/lib/supabase/client';

export type Mansione = {
  id: number;
  nome: string;
  stato: 'attivo' | 'inattivo';
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const mansioniService = {
  async getAll(): Promise<Mansione[]> {
    const { data, error } = await supabase
      .from('mansioni')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Errore nel recupero delle mansioni:', error);
      throw new Error(`Errore nel recupero delle mansioni: ${error.message}`);
    }
    return data || [];
  },

  async create(mansione: Omit<Mansione, 'id' | 'created_at' | 'updated_at'>): Promise<Mansione> {
    const { data, error } = await supabase
      .from('mansioni')
      .insert([mansione])
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione della mansione:', error);
      throw new Error(`Errore nella creazione della mansione: ${error.message}`);
    }
    return data;
  },

  async update(id: number, mansione: Partial<Omit<Mansione, 'id' | 'created_at' | 'updated_at'>>): Promise<Mansione> {
    const { data, error } = await supabase
      .from('mansioni')
      .update(mansione)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento della mansione:', error);
      throw new Error(`Errore nell'aggiornamento della mansione: ${error.message}`);
    }
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('mansioni')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione della mansione:', error);
      throw new Error(`Errore nell'eliminazione della mansione: ${error.message}`);
    }
  }
}; 