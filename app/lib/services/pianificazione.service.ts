import { createClient } from '@/lib/supabase/client';
import { addDays, differenceInDays } from 'date-fns';
import type { Database } from '@/types/supabase';
import { format } from 'date-fns';

export type PianificazioneInput = {
  dataInizio: Date;
  dataFine: Date;
  selettore: 'stazioni' | 'impianti';
  elementoId: string;
};

export class PianificazioneService {
  private supabase = createClient();

  async pianifica(input: PianificazioneInput) {
    const { dataInizio, dataFine, selettore, elementoId } = input;

    // Recupera il righello attivo per l'impianto
    const { data: righello, error: righelloError } = await this.supabase
      .from('righelli')
      .select('*')
      .eq('impianto_id', elementoId)
      .eq('stato', 'attivo')
      .single();

    if (righelloError || !righello) {
      throw new Error('Nessun righello attivo trovato per questo impianto');
    }

    // Recupera le posizioni del righello con la loro ciclicità
    const { data: posizioni, error: posizioniError } = await this.supabase
      .from('posizioni')
      .select(`
        *,
        ciclicita:ciclicita_id (
          id,
          nome
        )
      `)
      .eq('righello_id', righello.id)
      .order('numero');

    if (posizioniError || !posizioni || posizioni.length === 0) {
      throw new Error('Nessuna posizione trovata per questo righello');
    }

    // Calcola il numero di giorni tra data inizio e data fine
    const giorniTotali = differenceInDays(dataFine, dataInizio) + 1;

    // Per ogni giorno nel periodo
    for (let i = 0; i < giorniTotali; i++) {
      const dataTurno = addDays(dataInizio, i);
      
      // Per ogni posizione nel righello
      for (const posizione of posizioni) {
        // Recupera la sequenza dei turni per questa ciclicità
        const { data: turniSequenza, error: turniError } = await this.supabase
          .from('turni_ciclicita')
          .select('turno_id')
          .eq('ciclicita_id', posizione.ciclicita_id)
          .order('turno_sequenza');

        if (turniError || !turniSequenza || turniSequenza.length === 0) {
          console.warn(`Nessuna sequenza di turni trovata per la ciclicità ${posizione.ciclicita?.nome}`);
          continue;
        }

        // Calcola il turno per questa posizione in questo giorno
        const giorniDallInizio = differenceInDays(dataTurno, new Date(righello.data_inizio));
        // Aggiungi la sequenza di partenza della posizione al calcolo
        const turnoIndex = (giorniDallInizio + posizione.sequenza - 1) % turniSequenza.length;
        const turnoId = turniSequenza[turnoIndex].turno_id;

        // Recupera il tipo del turno
        const { data: turno, error: turnoError } = await this.supabase
          .from('turni')
          .select('tipo')
          .eq('id', turnoId)
          .single();

        if (turnoError || !turno) {
          throw new Error(`Errore nel recupero del tipo del turno: ${turnoError?.message}`);
        }

        // Recupera il tipo dell'impianto
        const { data: impianto, error: impiantoError } = await this.supabase
          .from('impianti')
          .select('mansione_id')
          .eq('id', elementoId)
          .single();

        if (impiantoError || !impianto) {
          throw new Error(`Errore nel recupero del tipo dell'impianto: ${impiantoError?.message}`);
        }

        // Crea il record nel registro turni ordinari
        const { error: insertError } = await this.supabase
          .from('registro_turni_ordinari')
          .insert({
            data: dataTurno.toISOString(),
            turno_id: turnoId,
            agente_id: posizione.agente_id, // Può essere null se il turno è vacante
            impianto_id: elementoId,
            posizione_id: posizione.id,
            assente: posizione.agente_id === null, // Imposta assente a true se agente_id è null
            soppresso: false, // Imposta soppresso a false di default
            is_disponibile: turno.tipo === 'disponibilita',
            is_compensativo: turno.tipo === 'compensativo',
            is_riposo: turno.tipo === 'riposo',
            mansione_id: impianto.mansione_id
          });

        if (insertError) {
          throw new Error(`Errore durante l'inserimento del turno: ${insertError.message}`);
        }
      }
    }
  }
} 