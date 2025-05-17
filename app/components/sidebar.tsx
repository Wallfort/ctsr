'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { format } from 'date-fns';

type AgenteDisponibile = {
  id: string;
  cognome: string;
  nome: string;
  impianto: string;
};

interface AgenteCT {
  agente: {
    id: string;
    cognome: string;
    nome: string;
  };
  tipi_assenza: {
    codice: string;
  };
}

interface TurnoData {
  impianto: {
    nome: string;
  };
}

interface SidebarProps {
  data: Date;
}

export function Sidebar({ data }: SidebarProps) {
  const [agentiDisponibili, setAgentiDisponibili] = useState<AgenteDisponibile[]>([]);
  const [agentiRC, setAgentiRC] = useState<AgenteDisponibile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const formattedDate = format(data, 'yyyy-MM-dd');
    loadAgentiDisponibili(formattedDate);
  }, [data]);

  const loadAgentiDisponibili = async (formattedDate: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();

      // Recupera gli agenti con assenza CT
      const { data: agentiCT, error: errorCT } = await supabase
        .from('registro_assenze')
        .select(`
          agente:agenti!registro_assenze_agente_id_fkey (
            id,
            cognome,
            nome
          ),
          tipi_assenza!registro_assenze_assenza_id_fkey (
            codice
          )
        `)
        .eq('data', formattedDate)
        .eq('tipi_assenza.codice', 'CT')
        .returns<AgenteCT[]>();

      if (errorCT) {
        throw new Error('Errore nel recupero degli agenti con assenza CT');
      }

      // Per gli agenti con assenza CT, recupera l'impianto e verifica se è sostituto
      const impiantiPromises = agentiCT?.map(async (agenteCT) => {
        // Verifica se l'agente è sostituto
        const { data: sostitutoData } = await supabase
          .from('registro_turni_ordinari')
          .select('id')
          .eq('sostituto_id', agenteCT.agente.id)
          .eq('data', formattedDate)
          .single();

        // Se l'agente è sostituto, non lo includiamo
        if (sostitutoData) {
          return null;
        }

        const { data: turnoData } = await supabase
          .from('registro_turni_ordinari')
          .select(`
            impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
              nome
            )
          `)
          .eq('agente_id', agenteCT.agente.id)
          .eq('data', formattedDate)
          .single()
          .returns<TurnoData>();

        return {
          id: agenteCT.agente.id,
          cognome: agenteCT.agente.cognome,
          nome: agenteCT.agente.nome,
          impianto: turnoData?.impianto?.nome || 'Impianto non assegnato'
        };
      }) || [];

      const impiantiCT = (await Promise.all(impiantiPromises)).filter(Boolean);

      // Recupera gli agenti disponibili
      const { data: agentiDisponibili, error: errorDisponibili } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            id,
            cognome,
            nome
          ),
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
            nome
          )
        `)
        .eq('data', formattedDate)
        .eq('is_disponibile', true)
        .not('agente_id', 'is', null);

      if (errorDisponibili) {
        throw new Error('Errore nel recupero degli agenti disponibili');
      }

      // Elabora gli agenti disponibili, escludendo i sostituti
      const agentiDisponibiliElaborati = await Promise.all(
        (agentiDisponibili || [])
          .filter(entry => entry.agente && entry.impianto?.nome)
          .map(async entry => {
            // Verifica se l'agente è sostituto
            const { data: sostitutoData } = await supabase
              .from('registro_turni_ordinari')
              .select('id')
              .eq('sostituto_id', entry.agente.id)
              .eq('data', formattedDate)
              .single();

            // Se l'agente è sostituto, non lo includiamo
            if (sostitutoData) {
              return null;
            }

            return {
              id: entry.agente.id,
              cognome: entry.agente.cognome,
              nome: entry.agente.nome,
              impianto: entry.impianto.nome
            };
          })
      );

      // Recupera gli agenti in RC
      const { data: agentiRC, error: errorRC } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente:agenti!registro_turni_ordinari_agente_id_fkey (
            id,
            cognome,
            nome
          ),
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey (
            nome
          )
        `)
        .eq('data', formattedDate)
        .eq('is_compensativo', true)
        .not('agente_id', 'is', null);

      if (errorRC) {
        throw new Error('Errore nel recupero degli agenti in RC');
      }

      // Elabora gli agenti in RC, escludendo i sostituti
      const agentiRCElaborati = await Promise.all(
        (agentiRC || [])
          .filter(entry => entry.agente && entry.impianto?.nome)
          .map(async entry => {
            // Verifica se l'agente è sostituto
            const { data: sostitutoData } = await supabase
              .from('registro_turni_ordinari')
              .select('id')
              .eq('sostituto_id', entry.agente.id)
              .eq('data', formattedDate)
              .single();

            // Se l'agente è sostituto, non lo includiamo
            if (sostitutoData) {
              return null;
            }

            return {
              id: entry.agente.id,
              cognome: entry.agente.cognome,
              nome: entry.agente.nome,
              impianto: entry.impianto.nome
            };
          })
      );

      // Combina e ordina tutti gli agenti disponibili
      const tuttiGliAgenti = [...impiantiCT, ...agentiDisponibiliElaborati.filter(Boolean)].sort((a, b) => {
        if (a.cognome === b.cognome) {
          return a.nome.localeCompare(b.nome);
        }
        return a.cognome.localeCompare(b.cognome);
      });

      // Ordina gli agenti in RC
      const agentiRCOrdinati = agentiRCElaborati.filter(Boolean).sort((a, b) => {
        if (a.cognome === b.cognome) {
          return a.nome.localeCompare(b.nome);
        }
        return a.cognome.localeCompare(b.cognome);
      });

      setAgentiDisponibili(tuttiGliAgenti);
      setAgentiRC(agentiRCOrdinati);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento degli agenti disponibili');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Agenti disponibili</h2>
      <div className="space-y-2">
        {agentiDisponibili.map(agente => (
          <div key={agente.id} className="text-sm">
            {agente.cognome} {agente.nome.charAt(0)}. ({agente.impianto})
          </div>
        ))}
        {agentiDisponibili.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun agente disponibile per questa data
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-6 mb-4">Agenti in RC</h2>
      <div className="space-y-2">
        {agentiRC.map(agente => (
          <div key={agente.id} className="text-sm">
            {agente.cognome} {agente.nome.charAt(0)}. ({agente.impianto})
          </div>
        ))}
        {agentiRC.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun agente in RC per questa data
          </div>
        )}
      </div>
    </div>
  );
} 