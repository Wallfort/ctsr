-- Abilita RLS (Row Level Security)
ALTER TABLE mansioni ENABLE ROW LEVEL SECURITY;

-- Elimina le policy esistenti
DROP POLICY IF EXISTS "Tutti possono leggere le mansioni" ON mansioni;
DROP POLICY IF EXISTS "Tutti possono inserire mansioni" ON mansioni;
DROP POLICY IF EXISTS "Tutti possono aggiornare mansioni" ON mansioni;
DROP POLICY IF EXISTS "Tutti possono eliminare mansioni" ON mansioni;

-- Crea una policy che permette a tutti di leggere le mansioni
CREATE POLICY "Tutti possono leggere le mansioni"
  ON mansioni FOR SELECT
  USING (true);

-- Crea una policy che permette a tutti di inserire nuove mansioni
CREATE POLICY "Tutti possono inserire mansioni"
  ON mansioni FOR INSERT
  WITH CHECK (true);

-- Crea una policy che permette a tutti di aggiornare le mansioni
CREATE POLICY "Tutti possono aggiornare mansioni"
  ON mansioni FOR UPDATE
  USING (true);

-- Crea una policy che permette a tutti di eliminare le mansioni
CREATE POLICY "Tutti possono eliminare mansioni"
  ON mansioni FOR DELETE
  USING (true); 