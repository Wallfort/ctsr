-- Rimuovi il vincolo UNIQUE dal campo codice della tabella turni
ALTER TABLE turni DROP CONSTRAINT IF EXISTS turni_codice_key;

-- Rimuovi l'indice sul campo codice se esiste
DROP INDEX IF EXISTS idx_turni_codice; 