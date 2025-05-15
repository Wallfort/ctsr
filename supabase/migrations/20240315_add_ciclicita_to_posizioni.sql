-- Aggiungi la colonna ciclicita_id alla tabella posizioni
ALTER TABLE posizioni ADD COLUMN ciclicita_id UUID REFERENCES ciclicita(id);

-- Aggiungi un indice per migliorare le performance delle query
CREATE INDEX idx_posizioni_ciclicita ON posizioni(ciclicita_id);

-- Aggiungi un commento alla colonna
COMMENT ON COLUMN posizioni.ciclicita_id IS 'Riferimento alla ciclicità associata alla posizione (può essere null)'; 