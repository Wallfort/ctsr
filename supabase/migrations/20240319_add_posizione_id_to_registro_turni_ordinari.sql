-- Aggiungi la colonna posizione_id alla tabella registro_turni_ordinari
ALTER TABLE registro_turni_ordinari
ADD COLUMN posizione_id UUID REFERENCES posizioni(id);

-- Aggiungi un commento alla colonna
COMMENT ON COLUMN registro_turni_ordinari.posizione_id IS 'Riferimento alla posizione nel righello che ha generato questo turno';

-- Crea un indice per migliorare le performance delle query
CREATE INDEX idx_registro_turni_ordinari_posizione_id ON registro_turni_ordinari(posizione_id); 