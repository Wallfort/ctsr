export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agenti: {
        Row: {
          id: string
          nome: string
          cognome: string
          mansione_id: number | null
          matricola: number
          telefono1: string | null
          telefono2: string | null
          telefono3: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cognome: string
          mansione_id?: number | null
          matricola: number
          telefono1?: string | null
          telefono2?: string | null
          telefono3?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cognome?: string
          mansione_id?: number | null
          matricola?: number
          telefono1?: string | null
          telefono2?: string | null
          telefono3?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ciclicita: {
        Row: {
          id: string
          nome: string
          descrizione: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descrizione: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descrizione?: string
          created_at?: string
          updated_at?: string
        }
      }
      impianti: {
        Row: {
          id: string
          nome: string
          mansione_id: number | null
          nr_turni: number
          stato: 'attivo' | 'inattivo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          mansione_id?: number | null
          nr_turni?: number
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          mansione_id?: number | null
          nr_turni?: number
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
      }
      mansioni: {
        Row: {
          id: number
          nome: string
          stato: 'attivo' | 'inattivo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          nome: string
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          nome?: string
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
      }
      posizioni: {
        Row: {
          id: string
          righello_id: string
          agente_id: string | null
          numero: number
          sequenza: number
          ciclicita_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          righello_id: string
          agente_id?: string | null
          numero: number
          sequenza: number
          ciclicita_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          righello_id?: string
          agente_id?: string | null
          numero?: number
          sequenza?: number
          ciclicita_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      registro_turni_ordinari: {
        Row: {
          id: string
          data: string
          turno_id: number
          agente_id: string
          impianto_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          turno_id: number
          agente_id: string
          impianto_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          turno_id?: number
          agente_id?: string
          impianto_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      righelli: {
        Row: {
          id: string
          impianto_id: string
          nome: string
          posizioni: number
          data_inizio: string
          stato: 'attivo' | 'inattivo'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          impianto_id: string
          nome: string
          posizioni: number
          data_inizio: string
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          impianto_id?: string
          nome?: string
          posizioni?: number
          data_inizio?: string
          stato?: 'attivo' | 'inattivo'
          created_at?: string
          updated_at?: string
        }
      }
      turni: {
        Row: {
          id: number
          codice: string
          nome: string
          orario_inizio: string
          orario_fine: string
          durata_minuti: number
          tipo: 'ordinario' | 'compensativo' | 'disponibilita' | 'riposo'
          descrizione: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          codice: string
          nome: string
          orario_inizio: string
          orario_fine: string
          durata_minuti: number
          tipo: 'ordinario' | 'compensativo' | 'disponibilita' | 'riposo'
          descrizione?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          codice?: string
          nome?: string
          orario_inizio?: string
          orario_fine?: string
          durata_minuti?: number
          tipo?: 'ordinario' | 'compensativo' | 'disponibilita' | 'riposo'
          descrizione?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      turni_ciclicita: {
        Row: {
          id: string
          turno_id: number
          ciclicita_id: string
          turno_sequenza: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          turno_id: number
          ciclicita_id: string
          turno_sequenza: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          turno_id?: number
          ciclicita_id?: string
          turno_sequenza?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      stato_attivo: 'attivo' | 'inattivo'
      turno_tipo: 'ordinario' | 'compensativo' | 'disponibilita' | 'riposo'
    }
  }
} 