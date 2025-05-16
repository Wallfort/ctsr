import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

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
  },

  async assegnaAssenza(turnoId: string, assenzaId: number) {
    // Recupera il turno
    const { data: turno, error: turnoError } = await supabase
      .from('registro_turni_ordinari')
      .select('*')
      .eq('id', turnoId)
      .single();

    if (turnoError || !turno) {
      throw new Error('Turno non trovato');
    }

    // Aggiorna il turno come assente
    const { error: updateError } = await supabase
      .from('registro_turni_ordinari')
      .update({ assente: true })
      .eq('id', turnoId);

    if (updateError) {
      throw new Error('Errore nell\'aggiornamento del turno');
    }

    // Crea il record di assenza
    const { error: assenzaError } = await supabase
      .from('registro_assenze')
      .insert({
        data: turno.data,
        assenza_id: assenzaId,
        agente_id: turno.agente_id
      });

    if (assenzaError) {
      // Se c'è un errore nell'inserimento dell'assenza, ripristina il turno
      await supabase
        .from('registro_turni_ordinari')
        .update({ assente: false })
        .eq('id', turnoId);
      throw new Error('Errore nell\'inserimento dell\'assenza');
    }
  },

  async rimuoviAssenza(turnoId: string) {
    // Recupera il turno
    const { data: turno, error: turnoError } = await supabase
      .from('registro_turni_ordinari')
      .select('*')
      .eq('id', turnoId)
      .single();

    if (turnoError || !turno) {
      throw new Error('Turno non trovato');
    }

    // Rimuovi il record di assenza
    const { error: assenzaError } = await supabase
      .from('registro_assenze')
      .delete()
      .eq('agente_id', turno.agente_id)
      .eq('data', turno.data);

    if (assenzaError) {
      throw new Error('Errore nella rimozione dell\'assenza');
    }

    // Aggiorna il turno come presente
    const { error: updateError } = await supabase
      .from('registro_turni_ordinari')
      .update({ assente: false })
      .eq('id', turnoId);

    if (updateError) {
      throw new Error('Errore nell\'aggiornamento del turno');
    }
  },

  async getAssenzaPerTurno(turnoId: string) {
    const { data: turno, error: turnoError } = await supabase
      .from('registro_turni_ordinari')
      .select('*')
      .eq('id', turnoId)
      .single();

    if (turnoError || !turno) {
      throw new Error('Turno non trovato');
    }

    const { data: assenza, error: assenzaError } = await supabase
      .from('registro_assenze')
      .select('*, tipi_assenza(*)')
      .eq('agente_id', turno.agente_id)
      .eq('data', turno.data)
      .single();

    if (assenzaError && assenzaError.code !== 'PGRST116') { // PGRST116 è il codice per "nessun risultato trovato"
      throw new Error('Errore nel recupero dell\'assenza');
    }

    return assenza;
  }
}; 