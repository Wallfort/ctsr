-- Aggiungi i campi booleani con valori di default
ALTER TABLE registro_assenze
ADD COLUMN is_disponibile BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_compensativo BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_riposo BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN possibile_dt BOOLEAN NOT NULL DEFAULT false;

-- Aggiungi commenti ai campi
COMMENT ON COLUMN registro_assenze.is_disponibile IS 'Indica se l''agente è disponibile durante l''assenza';
COMMENT ON COLUMN registro_assenze.is_compensativo IS 'Indica se l''assenza è compensativa';
COMMENT ON COLUMN registro_assenze.is_riposo IS 'Indica se l''assenza è un riposo';
COMMENT ON COLUMN registro_assenze.possibile_dt IS 'Indica se l''agente può fare doppio turno durante l''assenza';

-- Crea indici per ottimizzare le query sui campi booleani
CREATE INDEX idx_registro_assenze_is_disponibile ON registro_assenze(is_disponibile);
CREATE INDEX idx_registro_assenze_is_compensativo ON registro_assenze(is_compensativo);
CREATE INDEX idx_registro_assenze_is_riposo ON registro_assenze(is_riposo);
CREATE INDEX idx_registro_assenze_possibile_dt ON registro_assenze(possibile_dt);

-- Aggiungi vincoli di esclusione per evitare combinazioni non valide
ALTER TABLE registro_assenze
ADD CONSTRAINT check_assenze_mutually_exclusive 
CHECK (
    (is_disponibile = false AND is_compensativo = false AND is_riposo = false) OR
    (is_disponibile = true AND is_compensativo = false AND is_riposo = false) OR
    (is_disponibile = false AND is_compensativo = true AND is_riposo = false) OR
    (is_disponibile = false AND is_compensativo = false AND is_riposo = true)
); 