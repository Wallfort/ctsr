-- Aggiungi il campo mansione_id alla tabella registro_assenze
ALTER TABLE registro_assenze
ADD COLUMN mansione_id INTEGER REFERENCES mansioni(id);

-- Aggiungi un commento al campo
COMMENT ON COLUMN registro_assenze.mansione_id IS 'Mansione dell''agente al momento dell''assenza';

-- Crea un indice per migliorare le performance delle query
CREATE INDEX idx_registro_assenze_mansione_id ON registro_assenze(mansione_id);

-- Aggiorna i record esistenti con la mansione corrente dell'agente
UPDATE registro_assenze ra
SET mansione_id = a.mansione_id
FROM agenti a
WHERE ra.agente_id = a.id
AND ra.mansione_id IS NULL;

-- Rendi il campo NOT NULL dopo l'aggiornamento dei dati esistenti
ALTER TABLE registro_assenze
ALTER COLUMN mansione_id SET NOT NULL; 