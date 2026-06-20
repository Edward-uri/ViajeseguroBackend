BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_documento_vehiculo') THEN
    CREATE TYPE tipo_documento_vehiculo AS ENUM ('tarjeta_circulacion','foto_vehiculo','permiso_municipal'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estatus_vehiculo') THEN
    CREATE TYPE estatus_vehiculo AS ENUM ('activo','inactivo'); END IF;
END $$;

CREATE TABLE IF NOT EXISTS propietarios (
  id_propietario BIGINT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  rfc            VARCHAR(20),
  razon_social   VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_propietarios_updated_at ON propietarios;
CREATE TRIGGER trg_propietarios_updated_at BEFORE UPDATE ON propietarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propietario BIGINT NOT NULL REFERENCES propietarios(id_propietario) ON DELETE CASCADE,
  placa          VARCHAR(20) NOT NULL UNIQUE,
  modelo         VARCHAR(100),
  color          VARCHAR(30),
  anio           SMALLINT,
  id_municipio   BIGINT NOT NULL REFERENCES municipios(id_municipio),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehiculos_propietario ON vehiculos(id_propietario);
CREATE INDEX IF NOT EXISTS idx_vehiculos_municipio ON vehiculos(id_municipio);
DROP TRIGGER IF EXISTS trg_vehiculos_updated_at ON vehiculos;
CREATE TRIGGER trg_vehiculos_updated_at BEFORE UPDATE ON vehiculos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS vehiculo_cambio_estatus (
  id_cambio   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vehiculo BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  estatus     estatus_vehiculo NOT NULL,
  descripcion TEXT,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vehiculo_cambio_estatus ON vehiculo_cambio_estatus(id_vehiculo);

CREATE TABLE IF NOT EXISTS documentos_vehiculo (
  id_documento    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vehiculo     BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  tipo            tipo_documento_vehiculo NOT NULL,
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
  UNIQUE (id_vehiculo, tipo)
);
CREATE INDEX IF NOT EXISTS idx_documentos_vehiculo ON documentos_vehiculo(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_documentos_vehiculo_estado ON documentos_vehiculo(estado);
DROP TRIGGER IF EXISTS trg_documentos_vehiculo_updated_at ON documentos_vehiculo;
CREATE TRIGGER trg_documentos_vehiculo_updated_at BEFORE UPDATE ON documentos_vehiculo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
