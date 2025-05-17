-- Aggiungi i campi booleani con valori di default
ALTER TABLE tipi_assenza
ADD COLUMN is_disponibile BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_compensativo BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN is_riposo BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN possibile_dt BOOLEAN NOT NULL DEFAULT false;

-- Aggiungi commenti ai campi
COMMENT ON COLUMN tipi_assenza.is_disponibile IS 'Indica se l''agente è disponibile durante questo tipo di assenza';
COMMENT ON COLUMN tipi_assenza.is_compensativo IS 'Indica se questo tipo di assenza è compensativa';
COMMENT ON COLUMN tipi_assenza.is_riposo IS 'Indica se questo tipo di assenza è un riposo';
COMMENT ON COLUMN tipi_assenza.possibile_dt IS 'Indica se l''agente può fare doppio turno durante questo tipo di assenza';

-- Crea indici per ottimizzare le query sui campi booleani
CREATE INDEX idx_tipi_assenza_is_disponibile ON tipi_assenza(is_disponibile);
CREATE INDEX idx_tipi_assenza_is_compensativo ON tipi_assenza(is_compensativo);
CREATE INDEX idx_tipi_assenza_is_riposo ON tipi_assenza(is_riposo);
CREATE INDEX idx_tipi_assenza_possibile_dt ON tipi_assenza(possibile_dt);

-- Aggiungi vincoli di esclusione per evitare combinazioni non valide
ALTER TABLE tipi_assenza
ADD CONSTRAINT check_tipi_assenza_mutually_exclusive 
CHECK (
    (is_disponibile = false AND is_compensativo = false AND is_riposo = false) OR
    (is_disponibile = true AND is_compensativo = false AND is_riposo = false) OR
    (is_disponibile = false AND is_compensativo = true AND is_riposo = false) OR
    (is_disponibile = false AND is_compensativo = false AND is_riposo = true)
); 