-- Crea il tipo ENUM per le prestazioni del sostituto
CREATE TYPE prestazione_sostituto AS ENUM (
    'cambio_turno',
    'disponibilita',
    'doppio_turno',
    'doppio_rc'
);

-- Aggiungi la colonna prestazione_sostituto alla tabella registro_turni_ordinari
ALTER TABLE registro_turni_ordinari
ADD COLUMN prestazione_sostituto prestazione_sostituto;

-- Aggiungi un commento alla colonna
COMMENT ON COLUMN registro_turni_ordinari.prestazione_sostituto IS 'Tipo di prestazione dell''agente sostituto (cambio turno, disponibilità, doppio turno, doppio RC)';

-- Crea un indice per migliorare le performance delle query
CREATE INDEX idx_registro_turni_ordinari_prestazione ON registro_turni_ordinari(prestazione_sostituto);

-- Aggiungi un vincolo per assicurarsi che prestazione_sostituto sia presente quando c'è un sostituto
ALTER TABLE registro_turni_ordinari
ADD CONSTRAINT check_prestazione_sostituto
CHECK (
    (sostituto_id IS NULL) OR
    (sostituto_id IS NOT NULL AND prestazione_sostituto IS NOT NULL)
); 