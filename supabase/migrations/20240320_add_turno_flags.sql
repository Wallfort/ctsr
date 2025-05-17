-- Aggiungo i campi per categorizzare i turni
ALTER TABLE registro_turni_ordinari
ADD COLUMN is_disponibile BOOLEAN DEFAULT false,
ADD COLUMN is_compensativo BOOLEAN DEFAULT false,
ADD COLUMN is_riposo BOOLEAN DEFAULT false;

-- Creo indici per ottimizzare le query di lettura
CREATE INDEX idx_registro_turni_ordinari_disponibile 
ON registro_turni_ordinari(is_disponibile, data);

CREATE INDEX idx_registro_turni_ordinari_compensativo 
ON registro_turni_ordinari(is_compensativo, data);

CREATE INDEX idx_registro_turni_ordinari_riposo 
ON registro_turni_ordinari(is_riposo, data);

-- Aggiungo commenti per documentare lo scopo dei campi
COMMENT ON COLUMN registro_turni_ordinari.is_disponibile IS 'Indica se il turno è di tipo disponibilità';
COMMENT ON COLUMN registro_turni_ordinari.is_compensativo IS 'Indica se il turno è di tipo compensativo';
COMMENT ON COLUMN registro_turni_ordinari.is_riposo IS 'Indica se il turno è di tipo riposo'; 