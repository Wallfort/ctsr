import { createClient } from '@/lib/supabase/client';

export type Impianto = {
  id: string;
  nome: string;
  mansione_id: number;
  nr_turni: number;
  stato: 'attivo' | 'inattivo';
  linea_id: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Linea = {
  id: number;
  nome: string;
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

  async getById(id: string): Promise<Impianto> {
    const { data, error } = await supabase
      .from('impianti')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Errore nel recupero dell\'impianto:', error);
      throw new Error(`Errore nel recupero dell'impianto: ${error.message}`);
    }
    return data;
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
  },

  async getLinee(): Promise<Linea[]> {
    const { data, error } = await supabase
      .from('linee')
      .select('id, nome')
      .order('nome');

    if (error) {
      console.error('Errore nel recupero delle linee:', error);
      throw new Error(`Errore nel recupero delle linee: ${error.message}`);
    }
    return data || [];
  }
}; 