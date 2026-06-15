BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_documento') THEN
    CREATE TYPE tipo_documento AS ENUM ('licencia','ine_frente','ine_reverso','tarjeta_circulacion','foto_vehiculo'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estado_documento') THEN
    CREATE TYPE estado_documento AS ENUM ('pendiente','aprobado','rechazado'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estatus_conductor') THEN
    CREATE TYPE estatus_conductor AS ENUM ('habilitado','inhabilitado'); END IF;
END $$;

CREATE TABLE IF NOT EXISTS conductores (
  id_conductor               BIGINT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  licencia                   VARCHAR(50),
  licencia_fecha_expedicion  DATE,
  licencia_fecha_vencimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_conductores_updated_at ON conductores;
CREATE TRIGGER trg_conductores_updated_at BEFORE UPDATE ON conductores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS conductor_cambio_estatus (
  id_cambio    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_conductor BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  estatus      estatus_conductor NOT NULL,
  descripcion  TEXT,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cambio_estatus_conductor ON conductor_cambio_estatus(id_conductor);

CREATE TABLE IF NOT EXISTS documentos_conductor (
  id_documento    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_conductor    BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  tipo            tipo_documento   NOT NULL,
  archivo_key     VARCHAR(500)     NOT NULL,
  nombre_original VARCHAR(255),
  mime_type       VARCHAR(100)     NOT NULL,
  tamano_bytes    INTEGER          NOT NULL,
  estado          estado_documento NOT NULL DEFAULT 'pendiente',
  motivo_rechazo  TEXT,
  revisado_por    BIGINT REFERENCES usuarios(id_usuario),
  revisado_en     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_conductor, tipo)
);
CREATE INDEX IF NOT EXISTS idx_documentos_conductor ON documentos_conductor(id_conductor);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos_conductor(estado);
DROP TRIGGER IF EXISTS trg_documentos_updated_at ON documentos_conductor;
CREATE TRIGGER trg_documentos_updated_at BEFORE UPDATE ON documentos_conductor
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
