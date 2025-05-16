-- Modifica il vincolo NOT NULL sulla colonna agente_id
ALTER TABLE registro_turni_ordinari
ALTER COLUMN agente_id DROP NOT NULL; 