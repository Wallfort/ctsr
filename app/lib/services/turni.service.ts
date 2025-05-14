import { createClient } from '@/lib/supabase/client';

export type Turno = {
  id: number;
  codice: string;
  nome: string;
  orario_inizio: string;
  orario_fine: string;
  durata_minuti: number;
  tipo: 'ordinario' | 'compensativo' | 'disponibilita' | 'riposo';
  descrizione: string;
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const turniService = {
  async getAll(): Promise<Turno[]> {
    const { data, error } = await supabase
      .from('turni')
      .select('*')
      .order('orario_inizio');
    
    if (error) {
      console.error('Errore nel recupero dei turni:', error);
      throw new Error(`Errore nel recupero dei turni: ${error.message}`);
    }
    return data || [];
  },

  async create(turno: Omit<Turno, 'id' | 'created_at' | 'updated_at'>): Promise<Turno> {
    const { data, error } = await supabase
      .from('turni')
      .insert([turno])
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione del turno:', error);
      throw new Error(`Errore nella creazione del turno: ${error.message}`);
    }
    return data;
  },

  async update(id: number, turno: Partial<Omit<Turno, 'id' | 'created_at' | 'updated_at'>>): Promise<Turno> {
    const { data, error } = await supabase
      .from('turni')
      .update(turno)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento del turno:', error);
      throw new Error(`Errore nell'aggiornamento del turno: ${error.message}`);
    }
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('turni')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione del turno:', error);
      throw new Error(`Errore nell'eliminazione del turno: ${error.message}`);
    }
  }
}; 