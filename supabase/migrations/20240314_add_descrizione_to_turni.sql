-- Aggiungi la colonna descrizione alla tabella turni
ALTER TABLE turni ADD COLUMN descrizione TEXT;

-- Aggiorna i turni esistenti con una descrizione vuota
UPDATE turni SET descrizione = ''; 