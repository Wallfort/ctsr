-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE turno_tipo AS ENUM ('ordinario', 'compensativo', 'disponibilita', 'riposo');
CREATE TYPE stato_attivo AS ENUM ('attivo', 'inattivo');

-- Create tables with comments and optimized structure
COMMENT ON SCHEMA public IS 'Schema per la gestione dei turni e delle risorse umane';

CREATE TABLE "mansioni" (
    "id" SERIAL PRIMARY KEY,
    "nome" VARCHAR(255) NOT NULL,
    "stato" stato_attivo NOT NULL DEFAULT 'attivo',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "mansioni" IS 'Tabella delle mansioni disponibili';
COMMENT ON COLUMN "mansioni"."nome" IS 'Nome della mansione';
COMMENT ON COLUMN "mansioni"."stato" IS 'Stato della mansione (attivo/inattivo)';

CREATE TABLE "agenti" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" VARCHAR(255) NOT NULL,
    "cognome" VARCHAR(255) NOT NULL,
    "mansione_id" INTEGER REFERENCES "mansioni"("id"),
    "matricola" INTEGER NOT NULL UNIQUE,
    "telefono1" VARCHAR(20),
    "telefono2" VARCHAR(20),
    "telefono3" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "agenti" IS 'Tabella degli agenti';
COMMENT ON COLUMN "agenti"."matricola" IS 'Matricola univoca dell''agente';
CREATE INDEX idx_agenti_mansione ON "agenti"("mansione_id");
CREATE INDEX idx_agenti_matricola ON "agenti"("matricola");

CREATE TABLE "impianti" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" VARCHAR(255) NOT NULL,
    "mansione_id" INTEGER REFERENCES "mansioni"("id"),
    "nr_turni" INTEGER NOT NULL DEFAULT 0,
    "stato" stato_attivo NOT NULL DEFAULT 'attivo',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "impianti" IS 'Tabella degli impianti';
CREATE INDEX idx_impianti_mansione ON "impianti"("mansione_id");
CREATE INDEX idx_impianti_stato ON "impianti"("stato");

CREATE TABLE "turni" (
    "id" SERIAL PRIMARY KEY,
    "codice" VARCHAR(50) NOT NULL UNIQUE,
    "nome" VARCHAR(255) NOT NULL,
    "orario_inizio" TIME NOT NULL,
    "orario_fine" TIME NOT NULL,
    "durata_minuti" INTEGER NOT NULL,
    "tipo" turno_tipo NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "check_orari_validi" CHECK (orario_inizio < orario_fine),
    CONSTRAINT "check_durata" CHECK (durata_minuti > 0)
);
COMMENT ON TABLE "turni" IS 'Tabella dei turni disponibili';
CREATE INDEX idx_turni_codice ON "turni"("codice");
CREATE INDEX idx_turni_tipo ON "turni"("tipo");

CREATE TABLE "righelli" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "impianto_id" UUID NOT NULL REFERENCES "impianti"("id"),
    "nome" VARCHAR(255) NOT NULL,
    "posizioni" INTEGER NOT NULL CHECK (posizioni > 0),
    "data_inizio" DATE NOT NULL,
    "stato" stato_attivo NOT NULL DEFAULT 'attivo',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "righelli" IS 'Tabella dei righelli turni per impianto';
CREATE INDEX idx_righelli_impianto ON "righelli"("impianto_id");
CREATE INDEX idx_righelli_stato ON "righelli"("stato");

CREATE TABLE "posizioni" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "righello_id" UUID NOT NULL REFERENCES "righelli"("id"),
    "agente_id" UUID REFERENCES "agenti"("id"),
    "numero" INTEGER NOT NULL,
    "sequenza" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_posizione_righello" UNIQUE (righello_id, numero),
    CONSTRAINT "check_numero_positivo" CHECK (numero > 0),
    CONSTRAINT "check_sequenza_positiva" CHECK (sequenza > 0)
);
COMMENT ON TABLE "posizioni" IS 'Tabella delle posizioni nei righelli';
CREATE INDEX idx_posizioni_righello ON "posizioni"("righello_id");
CREATE INDEX idx_posizioni_agente ON "posizioni"("agente_id");

CREATE TABLE "ciclicita" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nome" VARCHAR(255) NOT NULL UNIQUE,
    "descrizione" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "ciclicita" IS 'Tabella delle ciclicità dei turni';

CREATE TABLE "turni_ciclicita" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "turno_id" INTEGER NOT NULL REFERENCES "turni"("id"),
    "ciclicita_id" UUID NOT NULL REFERENCES "ciclicita"("id"),
    "turno_sequenza" INTEGER NOT NULL CHECK (turno_sequenza > 0),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_turno_ciclicita" UNIQUE (turno_id, ciclicita_id, turno_sequenza)
);
COMMENT ON TABLE "turni_ciclicita" IS 'Tabella di collegamento tra turni e ciclicità';
CREATE INDEX idx_turni_ciclicita_turno ON "turni_ciclicita"("turno_id");
CREATE INDEX idx_turni_ciclicita_ciclicita ON "turni_ciclicita"("ciclicita_id");

CREATE TABLE "turni_estemporanei" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "codice" VARCHAR(50) NOT NULL UNIQUE,
    "nome" VARCHAR(255) NOT NULL,
    "impianto_id" UUID NOT NULL REFERENCES "impianti"("id"),
    "orario_inizio" TIME NOT NULL,
    "orario_fine" TIME NOT NULL,
    "durata_minuti" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "check_orari_validi" CHECK (orario_inizio < orario_fine),
    CONSTRAINT "check_durata" CHECK (durata_minuti > 0)
);
COMMENT ON TABLE "turni_estemporanei" IS 'Tabella dei turni estemporanei';
CREATE INDEX idx_turni_estemporanei_impianto ON "turni_estemporanei"("impianto_id");
CREATE INDEX idx_turni_estemporanei_codice ON "turni_estemporanei"("codice");

CREATE TABLE "assenze" (
    "id" SERIAL PRIMARY KEY,
    "codice" VARCHAR(50) NOT NULL UNIQUE,
    "nome" VARCHAR(255) NOT NULL,
    "tipo" turno_tipo NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE "assenze" IS 'Tabella delle tipologie di assenza';
CREATE INDEX idx_assenze_codice ON "assenze"("codice");
CREATE INDEX idx_assenze_tipo ON "assenze"("tipo");

-- Tabelle di registro
CREATE TABLE "registro_turni_ordinari" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "data" DATE NOT NULL,
    "turno_id" INTEGER NOT NULL REFERENCES "turni"("id"),
    "agente_id" UUID NOT NULL REFERENCES "agenti"("id"),
    "impianto_id" UUID NOT NULL REFERENCES "impianti"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_turno_agente_data" UNIQUE (agente_id, data, turno_id)
);
COMMENT ON TABLE "registro_turni_ordinari" IS 'Registro dei turni ordinari assegnati';
CREATE INDEX idx_registro_turni_data ON "registro_turni_ordinari"("data");
CREATE INDEX idx_registro_turni_agente ON "registro_turni_ordinari"("agente_id");
CREATE INDEX idx_registro_turni_impianto ON "registro_turni_ordinari"("impianto_id");

CREATE TABLE "registro_turni_estemporanei" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "data" DATE NOT NULL,
    "turno_estemporaneo_id" UUID NOT NULL REFERENCES "turni_estemporanei"("id"),
    "agente_id" UUID NOT NULL REFERENCES "agenti"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_estemporaneo_agente_data" UNIQUE (agente_id, data, turno_estemporaneo_id)
);
COMMENT ON TABLE "registro_turni_estemporanei" IS 'Registro dei turni estemporanei assegnati';
CREATE INDEX idx_registro_estemporanei_data ON "registro_turni_estemporanei"("data");
CREATE INDEX idx_registro_estemporanei_agente ON "registro_turni_estemporanei"("agente_id");

CREATE TABLE "registro_assenze" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "data" DATE NOT NULL,
    "assenza_id" INTEGER NOT NULL REFERENCES "assenze"("id"),
    "agente_id" UUID NOT NULL REFERENCES "agenti"("id"),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_assenza_agente_data" UNIQUE (agente_id, data, assenza_id)
);
COMMENT ON TABLE "registro_assenze" IS 'Registro delle assenze';
CREATE INDEX idx_registro_assenze_data ON "registro_assenze"("data");
CREATE INDEX idx_registro_assenze_agente ON "registro_assenze"("agente_id");

-- Funzione per aggiornare automaticamente il campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare automaticamente updated_at
CREATE TRIGGER update_mansioni_updated_at
    BEFORE UPDATE ON mansioni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agenti_updated_at
    BEFORE UPDATE ON agenti
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impianti_updated_at
    BEFORE UPDATE ON impianti
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turni_updated_at
    BEFORE UPDATE ON turni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_righelli_updated_at
    BEFORE UPDATE ON righelli
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posizioni_updated_at
    BEFORE UPDATE ON posizioni
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ciclicita_updated_at
    BEFORE UPDATE ON ciclicita
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turni_ciclicita_updated_at
    BEFORE UPDATE ON turni_ciclicita
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turni_estemporanei_updated_at
    BEFORE UPDATE ON turni_estemporanei
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assenze_updated_at
    BEFORE UPDATE ON assenze
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registro_turni_ordinari_updated_at
    BEFORE UPDATE ON registro_turni_ordinari
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registro_turni_estemporanei_updated_at
    BEFORE UPDATE ON registro_turni_estemporanei
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registro_assenze_updated_at
    BEFORE UPDATE ON registro_assenze
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 