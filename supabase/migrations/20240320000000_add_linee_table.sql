-- Create linee table
CREATE TABLE linee (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add linea_id to impianti table
ALTER TABLE impianti
ADD COLUMN linea_id INTEGER REFERENCES linee(id);

-- Insert initial linee data
INSERT INTO linee (nome) VALUES
    ('Sorrento'),
    ('Sarno'),
    ('Baiano'),
    ('Poggiomarino (via scafati)'),
    ('San Giorgio (via CDN)');

-- Create updated_at trigger for linee
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON linee
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 