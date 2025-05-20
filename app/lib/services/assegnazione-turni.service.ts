import { createClient } from '@/lib/supabase/client';
import { format, parseISO, differenceInMinutes } from 'date-fns';

export type TipoAssegnazione = 'disponibilita' | 'mancato_riposo_compensativo' | 'doppio_turno' | 'doppio_rc';

interface AssegnazioneTurnoParams {
  turnoId: string;
  agenteId: string;
  tipo: TipoAssegnazione;
  data: Date;
  impiantoId: string;
  mansioneId: number;
}

interface RimuoviAssegnazioneParams {
  turnoId: string;
  data: Date;
  impiantoId: string;
}

interface AgenteDisponibile {
  id: string;
  nome: string;
  cognome: string;
  orario_inizio_turno_attuale: string;
  orario_fine_turno_attuale: string;
  orario_inizio_turno_nuovo: string;
  orario_fine_turno_nuovo: string;
  sovrapposizione_minuti: number;
  impianto_originale: string;
}

interface Turno {
  orario_inizio: string;
  orario_fine: string;
}

interface Agente {
  nome: string;
  cognome: string;
}

interface AgenteInTurno {
  agente_id: string;
  turni: Turno;
  agenti: Agente;
  impianto: { nome: string };
}

export const assegnazioneTurniService = {
  /**
   * Recupera gli agenti disponibili per un doppio turno
   */
  async getAgentiDisponibiliDoppioTurno(turnoId: string, data: Date): Promise<AgenteDisponibile[]> {
    const supabase = createClient();
    const formattedDate = format(data, 'yyyy-MM-dd');

    try {
      console.log('Ricerca agenti disponibili per doppio turno:', { turnoId, data: formattedDate });

      // 1. Recupera l'orario del turno da coprire
      const { data: turnoDaCoprire, error: turnoError } = await supabase
        .from('turni')
        .select('orario_inizio, orario_fine')
        .eq('id', turnoId)
        .single();

      if (turnoError) {
        console.error('Errore nel recupero del turno:', turnoError);
        throw turnoError;
      }

      console.log('Turno da coprire:', turnoDaCoprire);

      // 2. Recupera tutti gli agenti che stanno facendo un turno ordinario
      const { data: agentiInTurno, error: agentiError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente_id,
          impianto_id,
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey(
            nome
          ),
          turni!inner(
            orario_inizio,
            orario_fine
          ),
          agenti!registro_turni_ordinari_agente_id_fkey(
            nome,
            cognome
          )
        `)
        .eq('data', formattedDate)
        .eq('assente', false)
        .is('is_disponibile', false)
        .is('is_compensativo', false)
        .is('is_riposo', false)
        .not('agente_id', 'is', null);

      if (agentiError) {
        console.error('Errore nel recupero degli agenti:', agentiError);
        throw agentiError;
      }

      console.log('Agenti in turno trovati:', JSON.stringify(agentiInTurno, null, 2));

      // 3. Recupera gli agenti che già fanno un doppio turno
      const { data: agentiDoppioTurno, error: doppioTurnoError } = await supabase
        .from('registro_turni_ordinari')
        .select('sostituto_id')
        .eq('data', formattedDate)
        .eq('prestazione_sostituto', 'doppio_turno')
        .not('sostituto_id', 'is', null);

      if (doppioTurnoError) {
        console.error('Errore nel recupero degli agenti con doppio turno:', doppioTurnoError);
        throw doppioTurnoError;
      }

      console.log('Agenti con doppio turno:', agentiDoppioTurno);

      // Crea un set di ID degli agenti che già fanno un doppio turno
      const agentiDoppioTurnoSet = new Set(agentiDoppioTurno?.map(a => a.sostituto_id) || []);
      console.log('Set di agenti con doppio turno:', Array.from(agentiDoppioTurnoSet));

      // 4. Filtra gli agenti in base alla compatibilità degli orari
      const agentiDisponibili = ((agentiInTurno as unknown) as AgenteInTurno[] || [])
        .filter(agente => {
          const isAvailable = !agentiDoppioTurnoSet.has(agente.agente_id);
          console.log(`Agente ${agente.agente_id} disponibile per doppio turno:`, isAvailable);
          return isAvailable;
        })
        .map(agente => {
          console.log('Processando agente:', JSON.stringify(agente, null, 2));
          
          if (!agente.turni || !agente.agenti) {
            console.error('Dati mancanti per agente:', agente);
            return null;
          }

          const turno = agente.turni;
          const agenteInfo = agente.agenti;
          
          if (!turno.orario_fine || !turnoDaCoprire.orario_inizio) {
            console.error('Orari mancanti:', { turno, turnoDaCoprire });
            return null;
          }

          const orarioFineTurnoAttuale = parseISO(`${formattedDate}T${turno.orario_fine}`);
          const orarioInizioTurnoAttuale = parseISO(`${formattedDate}T${turno.orario_inizio}`);
          const orarioInizioTurnoNuovo = parseISO(`${formattedDate}T${turnoDaCoprire.orario_inizio}`);
          const orarioFineTurnoNuovo = parseISO(`${formattedDate}T${turnoDaCoprire.orario_fine}`);
          
          let sovrapposizione_minuti = 0;
          
          // Verifica se c'è sovrapposizione
          // Caso 1: Nuovo turno PRIMA del turno esistente
          if (orarioFineTurnoNuovo > orarioInizioTurnoAttuale) {
            sovrapposizione_minuti = differenceInMinutes(orarioFineTurnoNuovo, orarioInizioTurnoAttuale);
          }
          // Caso 2: Nuovo turno DOPO il turno esistente
          else if (orarioFineTurnoAttuale > orarioInizioTurnoNuovo) {
            sovrapposizione_minuti = differenceInMinutes(orarioFineTurnoAttuale, orarioInizioTurnoNuovo);
          }

          console.log(`Sovrapposizione per agente ${agente.agente_id}:`, {
            orarioInizioTurnoAttuale: turno.orario_inizio,
            orarioFineTurnoAttuale: turno.orario_fine,
            orarioInizioTurnoNuovo: turnoDaCoprire.orario_inizio,
            orarioFineTurnoNuovo: turnoDaCoprire.orario_fine,
            sovrapposizione_minuti,
            overlapType: orarioFineTurnoNuovo > orarioInizioTurnoAttuale ? 'nuovo turno prima' : 
                        orarioFineTurnoAttuale > orarioInizioTurnoNuovo ? 'nuovo turno dopo' : 'nessuna sovrapposizione'
          });

          const agenteDisponibile: AgenteDisponibile = {
            id: agente.agente_id,
            nome: agenteInfo.nome,
            cognome: agenteInfo.cognome,
            orario_inizio_turno_attuale: turno.orario_inizio,
            orario_fine_turno_attuale: turno.orario_fine,
            orario_inizio_turno_nuovo: turnoDaCoprire.orario_inizio,
            orario_fine_turno_nuovo: turnoDaCoprire.orario_fine,
            sovrapposizione_minuti,
            impianto_originale: agente.impianto?.nome || ''
          };

          return agenteDisponibile;
        })
        .filter((agente): agente is AgenteDisponibile => {
          if (!agente) return false;
          const isCompatible = agente.sovrapposizione_minuti <= 100;
          console.log(`Agente ${agente.id} compatibile per sovrapposizione:`, isCompatible);
          return isCompatible;
        });

      // Secondo flusso: agenti in disponibilità
      const { data: agentiInDisponibilita, error: disponibilitaError } = await supabase
        .from('registro_turni_ordinari')
        .select(`
          agente_id,
          impianto:impianti!registro_turni_ordinari_impianto_id_fkey(
            nome
          ),
          agenti!registro_turni_ordinari_agente_id_fkey(
            nome,
            cognome
          )
        `)
        .eq('data', formattedDate)
        .eq('assente', false)
        .eq('is_compensativo', false)
        .eq('is_riposo', false)
        .eq('is_disponibile', true);

      if (disponibilitaError) {
        console.error('Errore nel recupero degli agenti in disponibilità:', disponibilitaError);
        throw disponibilitaError;
      }

      console.log('Agenti in disponibilità:', agentiInDisponibilita);

      // Recupera tutti i sostituti per la data
      const { data: sostituti, error: sostitutiError } = await supabase
        .from('registro_turni_ordinari')
        .select('sostituto_id, turno_id')
        .eq('data', formattedDate)
        .not('sostituto_id', 'is', null);

      if (sostitutiError) {
        console.error('Errore nel recupero dei sostituti:', sostitutiError);
        throw sostitutiError;
      }

      // Conta quante volte ogni agente appare come sostituto
      const conteggioSostituti = new Map<string, number>();
      const turniSostituti = new Map<string, string>(); // agente_id -> turno_id
      sostituti?.forEach(s => {
        if (s.sostituto_id) {
          conteggioSostituti.set(s.sostituto_id, (conteggioSostituti.get(s.sostituto_id) || 0) + 1);
          turniSostituti.set(s.sostituto_id, s.turno_id);
        }
      });

      // Recupera tutti i turni estemporanei per la data
      const { data: turniEstemporanei, error: estemporaneiError } = await supabase
        .from('registro_turni_estemporanei')
        .select('agente_id, turno_estemporaneo_id')
        .eq('data', formattedDate);

      if (estemporaneiError) {
        console.error('Errore nel recupero dei turni estemporanei:', estemporaneiError);
        throw estemporaneiError;
      }

      // Conta quante volte ogni agente appare nei turni estemporanei
      const conteggioEstemporanei = new Map<string, number>();
      const turniEstemporaneiMap = new Map<string, string>(); // agente_id -> turno_estemporaneo_id
      turniEstemporanei?.forEach(t => {
        conteggioEstemporanei.set(t.agente_id, (conteggioEstemporanei.get(t.agente_id) || 0) + 1);
        turniEstemporaneiMap.set(t.agente_id, t.turno_estemporaneo_id);
      });

      // Filtra gli agenti in disponibilità
      const agentiDisponibiliSecondoFlusso = await Promise.all(((agentiInDisponibilita as unknown) as AgenteInTurno[] || [])
        .filter(agente => {
          const conteggioSostituto = conteggioSostituti.get(agente.agente_id) || 0;
          const conteggioEstemporaneo = conteggioEstemporanei.get(agente.agente_id) || 0;
          const totaleTurni = conteggioSostituto + conteggioEstemporaneo;
          
          console.log(`Agente ${agente.agente_id} ha ${conteggioSostituto} turni come sostituto e ${conteggioEstemporaneo} turni estemporanei`);
          
          // Escludi se ha già due turni in qualsiasi combinazione
          if (totaleTurni >= 2) {
            console.log(`Agente ${agente.agente_id} escluso per troppi turni:`, {
              conteggioSostituto,
              conteggioEstemporaneo
            });
            return false;
          }

          return true;
        })
        .map(async agente => {
          if (!agente.agenti) {
            console.error('Dati mancanti per agente:', agente);
            return null;
          }

          const agenteInfo = agente.agenti;
          let turnoEsistente = null;
          
          // Recupera l'orario del turno esistente
          if (conteggioSostituti.get(agente.agente_id) === 1) {
            // L'agente ha un turno come sostituto
            const turnoId = turniSostituti.get(agente.agente_id);
            const { data: turnoData, error: turnoError } = await supabase
              .from('turni')
              .select('orario_inizio, orario_fine')
              .eq('id', turnoId)
              .single();

            if (turnoError) {
              console.error('Errore nel recupero del turno sostituto:', turnoError);
              return null;
            }

            turnoEsistente = turnoData;
          } else if (conteggioEstemporanei.get(agente.agente_id) === 1) {
            // L'agente ha un turno estemporaneo
            const turnoEstemporaneoId = turniEstemporaneiMap.get(agente.agente_id);
            const { data: turnoData, error: turnoError } = await supabase
              .from('turni_estemporanei')
              .select('orario_inizio, orario_fine')
              .eq('id', turnoEstemporaneoId)
              .single();

            if (turnoError) {
              console.error('Errore nel recupero del turno estemporaneo:', turnoError);
              return null;
            }

            turnoEsistente = turnoData;
          }

          // Se non ha turni esistenti, non c'è sovrapposizione
          if (!turnoEsistente) {
            console.log(`Agente ${agente.agente_id} non ha turni esistenti`);
            const agenteDisponibile: AgenteDisponibile = {
              id: agente.agente_id,
              nome: agenteInfo.nome,
              cognome: agenteInfo.cognome,
              orario_inizio_turno_attuale: '',
              orario_fine_turno_attuale: '',
              orario_inizio_turno_nuovo: turnoDaCoprire.orario_inizio,
              orario_fine_turno_nuovo: turnoDaCoprire.orario_fine,
              sovrapposizione_minuti: 0,
              impianto_originale: agente.impianto?.nome || ''
            };
            return agenteDisponibile;
          }

          const orarioFineTurnoAttuale = parseISO(`${formattedDate}T${turnoEsistente.orario_fine}`);
          const orarioInizioTurnoAttuale = parseISO(`${formattedDate}T${turnoEsistente.orario_inizio}`);
          const orarioInizioTurnoNuovo = parseISO(`${formattedDate}T${turnoDaCoprire.orario_inizio}`);
          const orarioFineTurnoNuovo = parseISO(`${formattedDate}T${turnoDaCoprire.orario_fine}`);
          
          let sovrapposizione_minuti = 0;
          
          // Verifica se c'è sovrapposizione
          // Caso 1: Nuovo turno PRIMA del turno esistente
          if (orarioFineTurnoNuovo > orarioInizioTurnoAttuale) {
            sovrapposizione_minuti = differenceInMinutes(orarioFineTurnoNuovo, orarioInizioTurnoAttuale);
          }
          // Caso 2: Nuovo turno DOPO il turno esistente
          else if (orarioFineTurnoAttuale > orarioInizioTurnoNuovo) {
            sovrapposizione_minuti = differenceInMinutes(orarioFineTurnoAttuale, orarioInizioTurnoNuovo);
          }

          const hasOverlap = sovrapposizione_minuti > 0;

          console.log(`Sovrapposizione per agente in disponibilità ${agente.agente_id}:`, {
            orarioInizioTurnoAttuale: turnoEsistente.orario_inizio,
            orarioFineTurnoAttuale: turnoEsistente.orario_fine,
            orarioInizioTurnoNuovo: turnoDaCoprire.orario_inizio,
            orarioFineTurnoNuovo: turnoDaCoprire.orario_fine,
            sovrapposizione_minuti,
            hasOverlap,
            overlapType: orarioFineTurnoNuovo > orarioInizioTurnoAttuale ? 'nuovo turno prima' : 
                        orarioFineTurnoAttuale > orarioInizioTurnoNuovo ? 'nuovo turno dopo' : 'nessuna sovrapposizione'
          });

          const agenteDisponibile: AgenteDisponibile = {
            id: agente.agente_id,
            nome: agenteInfo.nome,
            cognome: agenteInfo.cognome,
            orario_inizio_turno_attuale: turnoEsistente.orario_inizio,
            orario_fine_turno_attuale: turnoEsistente.orario_fine,
            orario_inizio_turno_nuovo: turnoDaCoprire.orario_inizio,
            orario_fine_turno_nuovo: turnoDaCoprire.orario_fine,
            sovrapposizione_minuti,
            impianto_originale: agente.impianto?.nome || ''
          };

          return agenteDisponibile;
        }));

      // Filtra gli agenti in base alla sovrapposizione
      const agentiDisponibiliSecondoFlussoFiltrati = agentiDisponibiliSecondoFlusso
        .filter((agente): agente is AgenteDisponibile => {
          if (!agente) return false;
          const isCompatible = agente.sovrapposizione_minuti <= 100;
          console.log(`Agente in disponibilità ${agente.id} compatibile per sovrapposizione:`, isCompatible);
          return isCompatible;
        });

      // Combina i risultati dei due flussi
      const tuttiAgentiDisponibili = [...agentiDisponibili, ...agentiDisponibiliSecondoFlussoFiltrati];

      console.log('Agenti disponibili finali:', tuttiAgentiDisponibili);
      return tuttiAgentiDisponibili;

    } catch (error) {
      console.error('Errore nel recupero degli agenti disponibili:', error);
      throw error;
    }
  },

  /**
   * Assegna un turno a un agente
   */
  async assegnaTurno({
    turnoId,
    agenteId,
    tipo,
    data,
    impiantoId,
    mansioneId
  }: AssegnazioneTurnoParams): Promise<void> {
    const supabase = createClient();
    const formattedDate = format(data, 'yyyy-MM-dd');

    try {
      console.log('Parametri ricevuti:', { turnoId, agenteId, tipo, data: formattedDate, impiantoId, mansioneId });

      // Verifica che il record esista
      const { data: existingRecord, error: checkError } = await supabase
        .from('registro_turni_ordinari')
        .select('*, turni!inner(durata_minuti)')
        .eq('impianto_id', impiantoId)
        .eq('data', formattedDate)
        .eq('turno_id', turnoId)
        .single();

      if (checkError) {
        console.error('Errore nel controllo del record:', checkError);
        throw checkError;
      }

      if (!existingRecord) {
        throw new Error('Record non trovato');
      }

      console.log('Record esistente trovato:', existingRecord);

      // Aggiorna il record con il sostituto
      const { error: updateError } = await supabase
        .from('registro_turni_ordinari')
        .update({ 
          sostituto_id: agenteId,
          prestazione_sostituto: tipo,
          is_straordinario: tipo === 'mancato_riposo_compensativo' || tipo === 'doppio_rc' || tipo === 'doppio_turno',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Errore nell\'aggiornamento del record:', updateError);
        throw updateError;
      }

      console.log('Record aggiornato con successo');

      // Se è un turno di straordinario (MRC, doppio turno o doppio RC), registra lo straordinario
      if (tipo === 'mancato_riposo_compensativo' || tipo === 'doppio_turno' || tipo === 'doppio_rc') {
        console.log('Tentativo di inserimento straordinario per tipo:', tipo);
        console.log('Dati dello straordinario:', {
          agente_id: agenteId,
          data: formattedDate,
          minutaggio: existingRecord.turni.durata_minuti,
          registro_ordinario_id: existingRecord.id
        });

        const { data: straordinarioData, error: straordinarioError } = await supabase
          .rpc('insert_straordinario', {
            p_agente_id: agenteId,
            p_data: formattedDate,
            p_minutaggio: existingRecord.turni.durata_minuti,
            p_registro_ordinario_id: existingRecord.id
          });

        if (straordinarioError) {
          console.error('Errore nell\'inserimento dello straordinario:', straordinarioError);
          console.error('Dettagli errore:', {
            code: straordinarioError.code,
            message: straordinarioError.message,
            details: straordinarioError.details,
            hint: straordinarioError.hint
          });
          throw straordinarioError;
        }

        console.log('Straordinario inserito con successo:', straordinarioData);
      }

    } catch (error) {
      console.error('Errore completo:', error);
      if (error instanceof Error) {
        console.error('Dettagli errore:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  },

  /**
   * Rimuove l'assegnazione di un turno
   */
  async rimuoviAssegnazione({
    turnoId,
    data,
    impiantoId
  }: RimuoviAssegnazioneParams): Promise<void> {
    const supabase = createClient();
    const formattedDate = format(data, 'yyyy-MM-dd');

    try {
      // Verifica che il record esista
      const { data: existingRecord, error: checkError } = await supabase
        .from('registro_turni_ordinari')
        .select('*')
        .eq('impianto_id', impiantoId)
        .eq('data', formattedDate)
        .eq('turno_id', turnoId)
        .single();

      if (checkError) {
        console.error('Errore nel controllo del record:', checkError);
        throw checkError;
      }

      if (!existingRecord) {
        throw new Error('Record non trovato');
      }

      // Se c'è un sostituto e il tipo è MRC, doppio turno o doppio RC, rimuovi anche lo straordinario
      if (existingRecord.sostituto_id && 
          (existingRecord.prestazione_sostituto === 'mancato_riposo_compensativo' || 
           existingRecord.prestazione_sostituto === 'doppio_turno' || 
           existingRecord.prestazione_sostituto === 'doppio_rc')) {
        
        // Recupera l'ID dello straordinario
        const { data: straordinarioData, error: straordinarioQueryError } = await supabase
          .from('straordinario')
          .select('id')
          .eq('registro_ordinario_id', existingRecord.id)
          .single();

        if (straordinarioQueryError) {
          console.error('Errore nel recupero dello straordinario:', straordinarioQueryError);
          throw straordinarioQueryError;
        }

        if (straordinarioData) {
          const { error: straordinarioError } = await supabase
            .rpc('delete_straordinario', {
              p_id: straordinarioData.id
            });

          if (straordinarioError) {
            console.error('Errore nella rimozione dello straordinario:', straordinarioError);
            throw straordinarioError;
          }
        }
      }

      // Aggiorna il record rimuovendo il sostituto
      const { error: updateError } = await supabase
        .from('registro_turni_ordinari')
        .update({ 
          sostituto_id: null,
          prestazione_sostituto: null,
          is_straordinario: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Errore nell\'aggiornamento del record:', updateError);
        throw updateError;
      }

    } catch (error) {
      console.error('Errore completo:', error);
      throw error;
    }
  }
}; 