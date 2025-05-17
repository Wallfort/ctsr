'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { format } from 'date-fns';
import { useSelector } from '@/lib/context/selector-context';

interface Impianto {
  id: number;
  nome: string;
}

interface Agente {
  id: string;
  cognome: string;
  nome: string;
}

interface AgenteDisponibile {
  id: string;
  nome: string;
  cognome: string;
  impianto: string;
}

interface AgenteCT {
  id: string;
  nome: string;
  cognome: string;
  impianto: string;
}

interface TurnoData {
  impianto: {
    nome: string;
  };
}

interface TurnoEntry {
  agente: Agente;
  impianto: {
    nome: string;
  };
}

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function Sidebar({ selectedDate, onDateChange }: SidebarProps) {
  const { selectedMansioneId } = useSelector();
  const [agentiDisponibili, setAgentiDisponibili] = useState<AgenteDisponibile[]>([]);
  const [agentiRC, setAgentiRC] = useState<AgenteCT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadAgentiDisponibili();
  }, [selectedDate, selectedMansioneId]);

  const loadAgentiDisponibili = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedMansioneId) {
        setAgentiDisponibili([]);
        setAgentiRC([]);
        return;
      }

      // Recupera gli impianti associati alla mansione selezionata
      const { data: impianti, error: impiantiError } = await supabase
        .from('impianti')
        .select('id')
        .eq('mansione_id', selectedMansioneId)
        .eq('stato', 'attivo');

      if (impiantiError) {
        throw new Error(`Errore nel recupero degli impianti: ${impiantiError.message}`);
      }

      if (!impianti || impianti.length === 0) {
        setAgentiDisponibili([]);
        setAgentiRC([]);
        return;
      }

      // Recupera gli agenti disponibili
      const { data: agentiDisponibiliData, error: disponibiliError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            id,
            nome,
            cognome
          ),
          sostituto_id,
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
            nome
          )
        `)
        .eq('data', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_disponibile', true)
        .in('impianto_id', impianti.map(i => i.id))
        .eq('mansione_id', selectedMansioneId)
        .returns<{
          agente: {
            id: string;
            nome: string;
            cognome: string;
          };
          sostituto_id: string | null;
          impianto: {
            nome: string;
          };
        }[]>();

      if (disponibiliError) {
        throw new Error(`Errore nel recupero degli agenti disponibili: ${disponibiliError.message}`);
      }

      // Recupera gli agenti disponibili dalle assenze
      const { data: agentiDisponibiliAssenzeData, error: disponibiliAssenzeError } = await supabase
        .from('registro_assenze')
        .select(`
          agente:agenti!registro_assenze_agente_id_fkey (
            id,
            nome,
            cognome
          )
        `)
        .eq('data', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_disponibile', true)
        .eq('mansione_id', selectedMansioneId)
        .returns<{
          agente: {
            id: string;
            nome: string;
            cognome: string;
          };
        }[]>();

      if (disponibiliAssenzeError) {
        throw new Error(`Errore nel recupero degli agenti disponibili dalle assenze: ${disponibiliAssenzeError.message}`);
      }

      // Recupera gli impianti per gli agenti dalle assenze
      const impiantiAssenze = await Promise.all(
        (agentiDisponibiliAssenzeData || []).map(async (assenza) => {
          const { data: turno } = await supabase
            .from('registro_turni_ordinari')
            .select(`
              impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
                nome
              )
            `)
            .eq('agente_id', assenza.agente.id)
            .eq('data', format(selectedDate, 'yyyy-MM-dd'))
            .single();

          return {
            agente_id: assenza.agente.id,
            impianto: turno?.impianto?.nome || 'N/A'
          };
        })
      );

      // Recupera gli agenti in RC
      const { data: agentiRCData, error: rcError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            id,
            nome,
            cognome
          ),
          sostituto_id,
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
            nome
          )
        `)
        .eq('data', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_compensativo', true)
        .in('impianto_id', impianti.map(i => i.id))
        .eq('mansione_id', selectedMansioneId)
        .returns<{
          agente: {
            id: string;
            nome: string;
            cognome: string;
          };
          sostituto_id: string | null;
          impianto: {
            nome: string;
          };
        }[]>();

      if (rcError) {
        throw new Error(`Errore nel recupero degli agenti in RC: ${rcError.message}`);
      }

      // Recupera gli agenti in RC dalle assenze
      const { data: agentiRCAssenzeData, error: rcAssenzeError } = await supabase
        .from('registro_assenze')
        .select(`
          agente:agenti!registro_assenze_agente_id_fkey (
            id,
            nome,
            cognome
          )
        `)
        .eq('data', format(selectedDate, 'yyyy-MM-dd'))
        .eq('is_compensativo', true)
        .eq('mansione_id', selectedMansioneId)
        .returns<{
          agente: {
            id: string;
            nome: string;
            cognome: string;
          };
        }[]>();

      if (rcAssenzeError) {
        throw new Error(`Errore nel recupero degli agenti in RC dalle assenze: ${rcAssenzeError.message}`);
      }

      // Recupera gli impianti per gli agenti in RC dalle assenze
      const impiantiRCAssenze = await Promise.all(
        (agentiRCAssenzeData || []).map(async (assenza) => {
          const { data: turno } = await supabase
            .from('registro_turni_ordinari')
            .select(`
              impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
                nome
              )
            `)
            .eq('agente_id', assenza.agente.id)
            .eq('data', format(selectedDate, 'yyyy-MM-dd'))
            .single();

          return {
            agente_id: assenza.agente.id,
            impianto: turno?.impianto?.nome || 'N/A'
          };
        })
      );

      // Combina e filtra i risultati
      const disponibili = [
        ...(agentiDisponibiliData?.filter(a => a.agente && !a.sostituto_id).map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: a.impianto.nome
        })) || []),
        ...(agentiDisponibiliAssenzeData?.map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: impiantiAssenze.find(i => i.agente_id === a.agente.id)?.impianto || 'N/A'
        })) || [])
      ].sort((a, b) => {
        if (a.cognome === b.cognome) {
          return a.nome.localeCompare(b.nome);
        }
        return a.cognome.localeCompare(b.cognome);
      });

      const rc = [
        ...(agentiRCData?.filter(a => a.agente && !a.sostituto_id).map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: a.impianto.nome
        })) || []),
        ...(agentiRCAssenzeData?.map(a => ({
          id: a.agente.id,
          nome: a.agente.nome,
          cognome: a.agente.cognome,
          impianto: impiantiRCAssenze.find(i => i.agente_id === a.agente.id)?.impianto || 'N/A'
        })) || [])
      ].sort((a, b) => {
        if (a.cognome === b.cognome) {
          return a.nome.localeCompare(b.nome);
        }
        return a.cognome.localeCompare(b.cognome);
      });

      setAgentiDisponibili(disponibili);
      setAgentiRC(rc);
    } catch (err) {
      console.error('Errore nel caricamento degli agenti:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli agenti');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Caricamento...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Agenti Disponibili</h2>
      <div className="space-y-2">
        {agentiDisponibili.map(agente => (
          <div key={agente.id} className="text-sm">
            {agente.cognome} {agente.nome.charAt(0)}. ({agente.impianto})
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-6 mb-4">Agenti in RC</h2>
      <div className="space-y-2">
        {agentiRC.map(agente => (
          <div key={agente.id} className="text-sm">
            {agente.cognome} {agente.nome.charAt(0)}. ({agente.impianto})
          </div>
        ))}
      </div>
    </div>
  );
} 