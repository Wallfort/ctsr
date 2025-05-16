-- Aggiungi la colonna sostituto_id alla tabella registro_turni_ordinari
ALTER TABLE registro_turni_ordinari ADD COLUMN sostituto_id UUID REFERENCES agenti(id);

-- Aggiungi un indice per migliorare le performance delle query
CREATE INDEX idx_registro_turni_sostituto ON registro_turni_ordinari(sostituto_id);

-- Aggiungi un commento alla colonna
COMMENT ON COLUMN registro_turni_ordinari.sostituto_id IS 'Riferimento all''agente sostituto (può essere null)';

-- Aggiungi le colonne assente e soppresso
ALTER TABLE registro_turni_ordinari 
    ADD COLUMN assente BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN soppresso BOOLEAN NOT NULL DEFAULT false;

-- Aggiungi i commenti alle nuove colonne
COMMENT ON COLUMN registro_turni_ordinari.assente IS 'Indica se l''agente originale è assente per questo turno (false = presente, true = assente)';
COMMENT ON COLUMN registro_turni_ordinari.soppresso IS 'Indica se il turno è stato soppresso (false = attivo, true = soppresso)';

-- Modifica le colonne assente e soppresso per renderle NOT NULL con default false
ALTER TABLE registro_turni_ordinari 
    ALTER COLUMN assente SET NOT NULL,
    ALTER COLUMN assente SET DEFAULT false,
    ALTER COLUMN soppresso SET NOT NULL,
    ALTER COLUMN soppresso SET DEFAULT false;

-- Aggiorna i commenti alle colonne
COMMENT ON COLUMN registro_turni_ordinari.assente IS 'Indica se l''agente originale è assente per questo turno (false = presente, true = assente)';
COMMENT ON COLUMN registro_turni_ordinari.soppresso IS 'Indica se il turno è stato soppresso (false = attivo, true = soppresso)'; 