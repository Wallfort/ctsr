import { createClient } from '@/lib/supabase/client';

export type BrogliaccioEntry = {
  impianto: string;
  agente_assente: string;
  turno: string;
  tipo_assenza: string;
};

export async function getBrogliaccioEntries(data: Date): Promise<BrogliaccioEntry[]> {
  const supabase = createClient();
  
  // Log della data che stiamo cercando
  const formattedDate = data.toISOString().split('T')[0];
  console.log('Cercando turni per la data:', formattedDate);
  
  const { data: entries, error } = await supabase
    .from('registro_turni_ordinari')
    .select(`
      impianto_id,
      agente_id,
      turno_id,
      impianti!inner (
        nome
      )
    `)
    .eq('assente', true)
    .eq('data', formattedDate);

  if (error) {
    console.error('Error fetching brogliaccio entries:', error);
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
        ...entry,
        agente,
        turno,
        tipo_assenza: tipoAssenza
      };
    })
  );

  // Log dei risultati
  console.log('Risultati query:', entriesWithDetails);

  // Filtriamo i risultati in base alla regola dei turni vacanti
  const filteredEntries = entriesWithDetails.filter(entry => {
    // Se c'è un agente, mostriamo sempre il turno
    if (entry.agente) return true;
    
    // Se non c'è agente (turno vacante), mostriamo solo i turni ordinari
    return entry.turno?.tipo === 'ordinario';
  });

  // Verifichiamo anche se ci sono turni per quella data, indipendentemente da assente
  const { data: allEntries } = await supabase
    .from('registri_turni_ordinari')
    .select('impianto, data, assente')
    .eq('data', formattedDate);
  
  console.log('Tutti i turni per questa data:', allEntries);

  return filteredEntries.map(entry => ({
    impianto: entry.impianti.nome,
    agente_assente: entry.agente 
      ? `${entry.agente.nome} ${entry.agente.cognome}`.trim()
      : 'Turno vacante',
    turno: entry.turno?.codice || '-',
    tipo_assenza: entry.tipo_assenza
  }));
} 