-- Aggiungi la colonna mansione_id alla tabella registro_turni_ordinari
ALTER TABLE registro_turni_ordinari
ADD COLUMN mansione_id INTEGER REFERENCES mansioni(id);

-- Aggiungi un commento alla colonna
COMMENT ON COLUMN registro_turni_ordinari.mansione_id IS 'Riferimento alla mansione dell''agente per questo turno';

-- Crea un indice per migliorare le performance delle query
CREATE INDEX idx_registro_turni_ordinari_mansione ON registro_turni_ordinari(mansione_id);

-- Aggiorna i record esistenti con la mansione dell'agente
UPDATE registro_turni_ordinari rto
SET mansione_id = a.mansione_id
FROM agenti a
WHERE rto.agente_id = a.id
AND a.mansione_id IS NOT NULL;

-- Aggiungi un trigger per mantenere aggiornato il campo mansione_id
CREATE OR REPLACE FUNCTION update_mansione_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Se l'agente_id è cambiato, aggiorna la mansione_id
    IF NEW.agente_id IS DISTINCT FROM OLD.agente_id THEN
        SELECT mansione_id INTO NEW.mansione_id
        FROM agenti
        WHERE id = NEW.agente_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_registro_turni_ordinari_mansione
    BEFORE INSERT OR UPDATE ON registro_turni_ordinari
    FOR EACH ROW
    EXECUTE FUNCTION update_mansione_id(); 