import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { startOfMonth, endOfMonth } from 'date-fns';

export class RegistriService {
  private supabase = createClient();

  async getRegistriMese(mese: Date) {
    const dataInizio = startOfMonth(mese);
    const dataFine = endOfMonth(mese);

    const { data: registri, error } = await this.supabase
      .from('registro_turni_ordinari')
      .select(`
        id,
        data,
        impianto_id,
        assente,
        agente_id,
        sostituto_id,
        turno:turni(*),
        agente:agenti(*),
        posizione:posizioni(*),
        registro_assenze!registro_turni_ordinari_id_fkey(
          id,
          tipi_assenza(
            id,
            codice,
            nome
          )
        )
      `)
      .gte('data', dataInizio.toISOString())
      .lte('data', dataFine.toISOString())
      .order('data');

    if (error) {
      throw new Error('Errore nel recupero dei registri');
    }

    // Log specifico per i turni assenti
    const turniAssenti = registri.filter(r => r.assente);
    console.log('Turni assenti trovati:', turniAssenti.map(r => ({
      id: r.id,
      data: r.data,
      agente_id: r.agente_id,
      sostituto_id: r.sostituto_id,
      registro_assenze: r.registro_assenze
    })));

    // Raggruppa i registri per impianto e data
    const registriPerImpianto = registri.reduce((acc, registro) => {
      const impiantoId = registro.impianto_id;
      const data = registro.data;

      if (!acc[impiantoId]) {
        acc[impiantoId] = {};
      }
      if (!acc[impiantoId][data]) {
        acc[impiantoId][data] = [];
      }

      acc[impiantoId][data].push(registro);
      return acc;
    }, {} as Record<string, Record<string, typeof registri>>);

    return registriPerImpianto;
  }
} 