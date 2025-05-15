import { createClient } from '@/lib/supabase/client';

export type Assenza = {
  id: string;
  agente_id: string;
  data_inizio: string;
  data_fine: string;
  motivo: string;
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const assenzeService = {
  async getAll(): Promise<Assenza[]> {
    const { data, error } = await supabase
      .from('assenze')
      .select(`
        *,
        agenti (
          id,
          nome,
          cognome
        )
      `)
      .order('data_inizio', { ascending: false });
    
    if (error) {
      console.error('Errore nel recupero delle assenze:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async getByAgente(agenteId: string): Promise<Assenza[]> {
    const { data, error } = await supabase
      .from('assenze')
      .select('*')
      .eq('agente_id', agenteId)
      .order('data_inizio', { ascending: false });
    
    if (error) {
      console.error('Errore nel recupero delle assenze dell\'agente:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(assenza: Omit<Assenza, 'id' | 'created_at' | 'updated_at'>): Promise<Assenza> {
    const { data, error } = await supabase
      .from('assenze')
      .insert(assenza)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione dell\'assenza:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async update(id: string, assenza: Partial<Omit<Assenza, 'id' | 'created_at' | 'updated_at'>>): Promise<Assenza> {
    const { data, error } = await supabase
      .from('assenze')
      .update(assenza)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento dell\'assenza:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assenze')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione dell\'assenza:', error);
      throw new Error(error.message);
    }
  }
}; 