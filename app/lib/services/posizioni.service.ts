import { createClient } from '@/lib/supabase/client';

type PosizioneBase = {
  id: string;
  righello_id: string;
  agente_id: string | null;
  numero: number;
  sequenza: number;
  ciclicita_id: string | null;
  created_at?: string;
  updated_at?: string;
};

type PosizioneWithRelations = PosizioneBase & {
  righelli: {
    id: string;
    nome: string;
    impianti: {
      id: string;
      nome: string;
    };
  };
};

export type Posizione = PosizioneBase;

const supabase = createClient();

export const posizioniService = {
  async getAll(): Promise<Posizione[]> {
    const { data, error } = await supabase
      .from('posizioni')
      .select('*')
      .order('numero');
    
    if (error) {
      console.error('Errore nel recupero delle posizioni:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async getByRighello(righelloId: string): Promise<Posizione[]> {
    const { data, error } = await supabase
      .from('posizioni')
      .select('*')
      .eq('righello_id', righelloId)
      .order('numero');
    
    if (error) {
      console.error('Errore nel recupero delle posizioni del righello:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async getByAgente(agenteId: string): Promise<PosizioneWithRelations[]> {
    const { data, error } = await supabase
      .from('posizioni')
      .select(`
        *,
        righelli!inner (
          id,
          nome,
          impianti!inner (
            id,
            nome
          )
        )
      `)
      .eq('agente_id', agenteId);
    
    if (error) {
      console.error('Errore nel recupero delle posizioni dell\'agente:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async create(posizione: Omit<Posizione, 'id' | 'created_at' | 'updated_at'>): Promise<Posizione> {
    const { data, error } = await supabase
      .from('posizioni')
      .insert(posizione)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nella creazione della posizione:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async createMany(posizioni: Omit<Posizione, 'id' | 'created_at' | 'updated_at'>[]): Promise<Posizione[]> {
    const { data, error } = await supabase
      .from('posizioni')
      .insert(posizioni)
      .select();
    
    if (error) {
      console.error('Errore nella creazione delle posizioni:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  },

  async update(id: string, posizione: Partial<Omit<Posizione, 'id' | 'created_at' | 'updated_at'>>): Promise<Posizione> {
    const { data, error } = await supabase
      .from('posizioni')
      .update(posizione)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento della posizione:', error);
      throw new Error(error.message);
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('posizioni')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione della posizione:', error);
      throw new Error(error.message);
    }
  },

  async deleteByRighello(righelloId: string): Promise<void> {
    const { error } = await supabase
      .from('posizioni')
      .delete()
      .eq('righello_id', righelloId);
    
    if (error) {
      console.error('Errore nell\'eliminazione delle posizioni del righello:', error);
      throw new Error(error.message);
    }
  }
};