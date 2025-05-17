import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { format } from 'date-fns';

export type BrogliaccioEntry = {
  impianto: string;
  impianto_id: string;
  agente_assente: string;
  turno: string;
  tipo_assenza: string;
  tipo_turno: string;
  is_non_ordinario: boolean;
  prestazione_sostituto?: string;
};

interface EntryWithDetails {
  impianti: {
    nome: string;
  };
  impianto_id: string;
  agente: {
    nome: string;
    cognome: string;
  } | null;
  turno: {
    codice: string;
    tipo: string;
  } | null;
  tipo_assenza: string;
  prestazione_sostituto: string | null;
}

export async function getBrogliaccioEntries(data: Date, mansioneId: number): Promise<BrogliaccioEntry[]> {
  const supabase = createClient();
  const formattedDate = format(data, 'yyyy-MM-dd');
  
  // Prima recuperiamo gli impianti associati alla mansione
  const { data: impianti, error: impiantiError } = await supabase
    .from('impianti')
    .select('id')
    .eq('mansione_id', mansioneId);

  if (impiantiError) {
    console.error('Errore nel recupero degli impianti:', impiantiError);
    return [];
  }

  if (!impianti || impianti.length === 0) {
    return [];
  }

  // Poi recuperiamo i turni solo per gli impianti della mansione
  const { data: entries, error } = await supabase
    .from('registro_turni_ordinari')
    .select(`
      impianto_id,
      agente_id,
      turno_id,
      prestazione_sostituto,
      impianti!inner (
        nome
      )
    `)
    .eq('assente', true)
    .eq('data', formattedDate)
    .in('impianto_id', impianti.map(i => i.id))
    .returns<{
      impianto_id: string;
      agente_id: string;
      turno_id: number;
      prestazione_sostituto: string | null;
      impianti: {
        nome: string;
      };
    }[]>();

  if (error) {
    console.error('Errore nel recupero dei turni:', error);
    return [];
  }

  // Per ogni entry, recuperiamo i dettagli dell'agente, del turno e dell'assenza
  const entriesWithDetails = await Promise.all(
    entries.map(async (entry) => {
      // Recupero dettagli agente
      let agente = null;
      let tipoAssenza = 'TV'; // Default per turni vacanti
      
      if (entry.agente_id) {
        const { data: agenteData } = await supabase
          .from('agenti')
          .select('nome, cognome')
          .eq('id', entry.agente_id)
          .single();
        agente = agenteData;

        // Recupero il tipo di assenza
        const { data: assenzaData } = await supabase
          .from('registro_assenze')
          .select('assenza_id')
          .eq('agente_id', entry.agente_id)
          .eq('data', formattedDate)
          .single();

        if (assenzaData?.assenza_id) {
          const { data: tipoAssenzaData } = await supabase
            .from('tipi_assenza')
            .select('codice')
            .eq('id', assenzaData.assenza_id)
            .single();
          
          tipoAssenza = tipoAssenzaData?.codice || '-';
        }
      }

      // Recupero dettagli turno
      const { data: turno } = await supabase
        .from('turni')
        .select('codice, tipo')
        .eq('id', entry.turno_id)
        .single();

      return {
        impianti: entry.impianti,
        impianto_id: entry.impianto_id,
        agente,
        turno,
        tipo_assenza: tipoAssenza,
        prestazione_sostituto: entry.prestazione_sostituto
      } as EntryWithDetails;
    })
  );

  // Filtriamo i risultati in base alla regola dei turni vacanti
  const filteredEntries = entriesWithDetails.filter(entry => {
    // Se c'è un agente, mostriamo sempre il turno
    if (entry.agente) return true;
    
    // Se non c'è agente (turno vacante), mostriamo solo i turni ordinari
    return entry.turno?.tipo === 'ordinario';
  });

  return filteredEntries.map(entry => ({
    impianto: entry.impianti.nome,
    impianto_id: entry.impianto_id,
    agente_assente: entry.agente 
      ? `${entry.agente.nome} ${entry.agente.cognome}`.trim()
      : 'Turno vacante',
    turno: entry.turno?.codice || '-',
    tipo_assenza: entry.tipo_assenza,
    tipo_turno: entry.turno?.tipo || '-',
    is_non_ordinario: entry.turno?.tipo !== 'ordinario',
    prestazione_sostituto: entry.prestazione_sostituto || undefined
  }));
}

export async function getTurniByData(data: Date) {
  const supabase = createClient();
  const formattedDate = format(data, 'yyyy-MM-dd');

  const { data: turni, error } = await supabase
    .from('registro_turni_ordinari')
    .select('impianto, data, assente')
    .eq('data', formattedDate);

  if (error) {
    throw new Error('Errore nel recupero dei turni');
  }

  return turni;
}

export async function getImpianti() {
  const supabase = createClient();

  const { data: impianti, error } = await supabase
    .from('impianti')
    .select('*')
    .order('nome');

  if (error) {
    throw new Error('Errore nel recupero degli impianti');
  }

  return impianti;
}

export async function getAgenti() {
  const supabase = createClient();

  const { data: agenti, error } = await supabase
    .from('agenti')
    .select('*')
    .order('cognome');

  if (error) {
    throw new Error('Errore nel recupero degli agenti');
  }

  return agenti;
}

export async function getTurni() {
  const supabase = createClient();

  const { data: turni, error } = await supabase
    .from('turni')
    .select('*')
    .order('id');

  if (error) {
    throw new Error('Errore nel recupero dei turni');
  }

  return turni;
}

export async function getTipiAssenza() {
  const supabase = createClient();

  const { data: tipiAssenza, error } = await supabase
    .from('tipi_assenza')
    .select('*')
    .order('codice');

  if (error) {
    throw new Error('Errore nel recupero dei tipi assenza');
  }

  return tipiAssenza;
}

export async function saveTurno(turno: {
  impianto_id: string;
  agente_id: string;
  turno_id: number;
  data: Date;
}) {
  const supabase = createClient();
  const formattedDate = format(turno.data, 'yyyy-MM-dd');

  const { error } = await supabase
    .from('registro_turni_ordinari')
    .upsert({
      impianto_id: turno.impianto_id,
      agente_id: turno.agente_id,
      turno_id: turno.turno_id,
      data: formattedDate
    });

  if (error) {
    throw new Error('Errore nel salvataggio del turno');
  }
}

export async function deleteTurno(turno: {
  impianto_id: string;
  agente_id: string;
  data: Date;
}) {
  const supabase = createClient();
  const formattedDate = format(turno.data, 'yyyy-MM-dd');

  const { error } = await supabase
    .from('registro_turni_ordinari')
    .delete()
    .eq('impianto_id', turno.impianto_id)
    .eq('agente_id', turno.agente_id)
    .eq('data', formattedDate);

  if (error) {
    throw new Error('Errore nell\'eliminazione del turno');
  }
}

export async function saveAssenza(assenza: {
  agente_id: string;
  assenza_id: number;
  data: Date;
}) {
  const supabase = createClient();
  const formattedDate = format(assenza.data, 'yyyy-MM-dd');

  const { error } = await supabase
    .from('registro_assenze')
    .upsert({
      agente_id: assenza.agente_id,
      assenza_id: assenza.assenza_id,
      data: formattedDate
    });

  if (error) {
    throw new Error('Errore nel salvataggio dell\'assenza');
  }
}

export async function deleteAssenza(assenza: {
  agente_id: string;
  data: Date;
}) {
  const supabase = createClient();
  const formattedDate = format(assenza.data, 'yyyy-MM-dd');

  const { error } = await supabase
    .from('registro_assenze')
    .delete()
    .eq('agente_id', assenza.agente_id)
    .eq('data', formattedDate);

  if (error) {
    throw new Error('Errore nell\'eliminazione dell\'assenza');
  }
} 