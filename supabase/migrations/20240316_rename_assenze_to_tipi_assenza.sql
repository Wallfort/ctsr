-- Rename table assenze to tipi_assenza
ALTER TABLE assenze RENAME TO tipi_assenza;

-- Add codice column if it doesn't exist
ALTER TABLE tipi_assenza ADD COLUMN IF NOT EXISTS codice VARCHAR(255);

-- Make codice and nome required
ALTER TABLE tipi_assenza ALTER COLUMN codice SET NOT NULL;
ALTER TABLE tipi_assenza ALTER COLUMN nome SET NOT NULL;

-- Remove tipo column if it exists
ALTER TABLE tipi_assenza DROP COLUMN IF EXISTS tipo; 