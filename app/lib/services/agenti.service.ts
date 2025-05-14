import { createClient } from '@/lib/supabase/client';

export type Agente = {
  id: string;
  nome: string;
  cognome: string;
  mansione_id: number | null;
  matricola: number;
  telefono1: string | null;
  telefono2: string | null;
  telefono3: string | null;
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const agentiService = {
  async getAll(): Promise<Agente[]> {
    const { data, error } = await supabase
      .from('agenti')
      .select('*')
      .order('cognome');
    
    if (error) {
      console.error('Errore nel recupero degli agenti:', error);
      throw new Error(`Errore nel recupero degli agenti: ${error.message}`);
    }
    return data || [];
  },

  async create(agente: Omit<Agente, 'id' | 'created_at' | 'updated_at'>): Promise<Agente> {
    const { data, error } = await supabase
      .from('agenti')
      .insert([agente])
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione dell\'agente:', error);
      throw new Error(`Errore nella creazione dell'agente: ${error.message}`);
    }
    return data;
  },

  async update(id: string, agente: Partial<Omit<Agente, 'id' | 'created_at' | 'updated_at'>>): Promise<Agente> {
    const { data, error } = await supabase
      .from('agenti')
      .update(agente)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento dell\'agente:', error);
      throw new Error(`Errore nell'aggiornamento dell'agente: ${error.message}`);
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agenti')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione dell\'agente:', error);
      throw new Error(`Errore nell'eliminazione dell'agente: ${error.message}`);
    }
  }
}; 