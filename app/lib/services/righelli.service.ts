import { createClient } from '@/lib/supabase/client';
import { posizioniService } from './posizioni.service';

export type Righello = {
  id: string;
  impianto_id: string;
  nome: string;
  posizioni: number;
  data_inizio: string;
  stato: 'attivo' | 'inattivo';
  created_at?: string;
  updated_at?: string;
};

const supabase = createClient();

export const righelliService = {
  async getAll(): Promise<Righello[]> {
    const { data, error } = await supabase
      .from('righelli')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Errore nel recupero dei righelli:', error);
      throw new Error(`Errore nel recupero dei righelli: ${error.message}`);
    }
    return data || [];
  },

  async getById(id: string): Promise<Righello> {
    const { data, error } = await supabase
      .from('righelli')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Errore nel recupero del righello:', error);
      throw new Error(`Errore nel recupero del righello: ${error.message}`);
    }
    return data;
  },

  async create(righello: Omit<Righello, 'id' | 'created_at' | 'updated_at'>): Promise<Righello> {
    // Inizia una transazione
    const { data: righelloData, error: righelloError } = await supabase
      .from('righelli')
      .insert([righello])
      .select()
      .single();
    
    if (righelloError) {
      console.error('Errore nella creazione del righello:', righelloError);
      throw new Error(`Errore nella creazione del righello: ${righelloError.message}`);
    }

    // Crea le posizioni per il righello
    const posizioni = Array.from({ length: righello.posizioni }, (_, i) => ({
      righello_id: righelloData.id,
      numero: i + 1,
      sequenza: i + 1,
      agente_id: null,
      ciclicita_id: null
    }));

    try {
      await posizioniService.createMany(posizioni);
    } catch (error) {
      // Se c'è un errore nella creazione delle posizioni, elimina il righello
      await supabase.from('righelli').delete().eq('id', righelloData.id);
      throw error;
    }

    return righelloData;
  },

  async update(id: string, righello: Partial<Omit<Righello, 'id' | 'created_at' | 'updated_at'>>): Promise<Righello> {
    // Se viene modificato il numero di posizioni
    if (righello.posizioni !== undefined) {
      // Recupera il righello esistente
      const { data: existingRighello, error: getError } = await supabase
        .from('righelli')
        .select('posizioni')
        .eq('id', id)
        .single();

      if (getError) {
        console.error('Errore nel recupero del righello:', getError);
        throw new Error(`Errore nel recupero del righello: ${getError.message}`);
      }

      // Se il numero di posizioni è diverso
      if (existingRighello.posizioni !== righello.posizioni) {
        // Elimina le posizioni esistenti
        await posizioniService.deleteByRighello(id);

        // Crea le nuove posizioni
        const posizioni = Array.from({ length: righello.posizioni }, (_, i) => ({
          righello_id: id,
          numero: i + 1,
          sequenza: i + 1,
          agente_id: null,
          ciclicita_id: null
        }));

        await posizioniService.createMany(posizioni);
      }
    }

    const { data, error } = await supabase
      .from('righelli')
      .update(righello)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Errore nell\'aggiornamento del righello:', error);
      throw new Error(`Errore nell'aggiornamento del righello: ${error.message}`);
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    // Elimina prima le posizioni associate
    await posizioniService.deleteByRighello(id);

    // Poi elimina il righello
    const { error } = await supabase
      .from('righelli')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Errore nell\'eliminazione del righello:', error);
      throw new Error(`Errore nell'eliminazione del righello: ${error.message}`);
    }
  }
}; 