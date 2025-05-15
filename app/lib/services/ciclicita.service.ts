import { createClient } from '@/lib/supabase/client';
import { type Turno } from './turni.service';

export type Ciclicita = {
  id: string;
  nome: string;
  descrizione: string;
  created_at?: string;
  updated_at?: string;
};

export type TurnoCiclicita = {
  id: string;
  turno_id: number;
  ciclicita_id: string;
  turno_sequenza: number;
  turno?: Turno;
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const ciclicitaService = {
  async getAll(): Promise<Ciclicita[]> {
    const { data, error } = await supabase
      .from('ciclicita')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Errore nel recupero delle ciclicità:', error);
      throw new Error(`Errore nel recupero delle ciclicità: ${error.message}`);
    }
    return data || [];
  },

  async getById(id: string): Promise<Ciclicita> {
    const { data, error } = await supabase
      .from('ciclicita')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Errore nel recupero della ciclicità:', error);
      throw new Error(`Errore nel recupero della ciclicità: ${error.message}`);
    }
    return data;
  },

  async create(ciclicita: Omit<Ciclicita, 'id' | 'created_at' | 'updated_at'>): Promise<Ciclicita> {
    const { data, error } = await supabase
      .from('ciclicita')
      .insert([ciclicita])
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione della ciclicità:', error);
      throw new Error(`Errore nella creazione della ciclicità: ${error.message}`);
    }
    return data;
  },

  async update(id: string, ciclicita: Partial<Omit<Ciclicita, 'id' | 'created_at' | 'updated_at'>>): Promise<Ciclicita> {
    const { data, error } = await supabase
      .from('ciclicita')
      .update(ciclicita)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento della ciclicità:', error);
      throw new Error(`Errore nell'aggiornamento della ciclicità: ${error.message}`);
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('ciclicita')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione della ciclicità:', error);
      throw new Error(`Errore nell'eliminazione della ciclicità: ${error.message}`);
    }
  },

  async getTurni(ciclicitaId: string): Promise<TurnoCiclicita[]> {
    const { data, error } = await supabase
      .from('turni_ciclicita')
      .select(`
        *,
        turno:turni(*)
      `)
      .eq('ciclicita_id', ciclicitaId)
      .order('turno_sequenza');
    
    if (error) {
      console.error('Errore nel recupero dei turni della ciclicità:', error);
      throw new Error(`Errore nel recupero dei turni della ciclicità: ${error.message}`);
    }
    return data || [];
  },

  async addTurno(turnoCiclicita: Omit<TurnoCiclicita, 'id' | 'created_at' | 'updated_at'>): Promise<TurnoCiclicita> {
    const { data, error } = await supabase
      .from('turni_ciclicita')
      .insert([turnoCiclicita])
      .select(`
        *,
        turno:turni(*)
      `)
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiunta del turno alla ciclicità:', error);
      throw new Error(`Errore nell'aggiunta del turno alla ciclicità: ${error.message}`);
    }
    return data;
  },

  async removeTurno(id: string): Promise<void> {
    const { error } = await supabase
      .from('turni_ciclicita')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nella rimozione del turno dalla ciclicità:', error);
      throw new Error(`Errore nella rimozione del turno dalla ciclicità: ${error.message}`);
    }
  },

  async updateTurnoSequenza(id: string, turno_sequenza: number): Promise<TurnoCiclicita> {
    const { data, error } = await supabase
      .from('turni_ciclicita')
      .update({ turno_sequenza })
      .eq('id', id)
      .select(`
        *,
        turno:turni(*)
      `)
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento della sequenza del turno:', error);
      throw new Error(`Errore nell'aggiornamento della sequenza del turno: ${error.message}`);
    }
    return data;
  }
}; 