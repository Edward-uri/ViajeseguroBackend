BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='origen_asignacion') THEN
    CREATE TYPE origen_asignacion AS ENUM ('propia','bolsa'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estado_vacante') THEN
    CREATE TYPE estado_vacante AS ENUM ('abierta','cerrada'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estado_postulacion') THEN
    CREATE TYPE estado_postulacion AS ENUM ('pendiente','aceptada','rechazada','retirada'); END IF;
END $$;

ALTER TABLE asignaciones_conductor_vehiculo
  ADD COLUMN IF NOT EXISTS origen origen_asignacion NOT NULL DEFAULT 'propia';

CREATE TABLE IF NOT EXISTS vacantes (
  id_vacante     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propietario BIGINT NOT NULL REFERENCES propietarios(id_propietario) ON DELETE CASCADE,
  id_vehiculo    BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  id_municipio   BIGINT NOT NULL REFERENCES municipios(id_municipio),
  condiciones    TEXT,
  estado         estado_vacante NOT NULL DEFAULT 'abierta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vacantes_municipio ON vacantes(id_municipio, estado);
CREATE INDEX IF NOT EXISTS idx_vacantes_propietario ON vacantes(id_propietario);
-- Una sola vacante abierta por vehículo:
CREATE UNIQUE INDEX IF NOT EXISTS uq_vacante_abierta_por_vehiculo ON vacantes(id_vehiculo) WHERE estado='abierta';
DROP TRIGGER IF EXISTS trg_vacantes_updated_at ON vacantes;
CREATE TRIGGER trg_vacantes_updated_at BEFORE UPDATE ON vacantes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS postulaciones (
  id_postulacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vacante     BIGINT NOT NULL REFERENCES vacantes(id_vacante) ON DELETE CASCADE,
  id_conductor   BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  estado         estado_postulacion NOT NULL DEFAULT 'pendiente',
  mensaje        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_vacante, id_conductor)
);
CREATE INDEX IF NOT EXISTS idx_postulaciones_conductor ON postulaciones(id_conductor, estado);
DROP TRIGGER IF EXISTS trg_postulaciones_updated_at ON postulaciones;
CREATE TRIGGER trg_postulaciones_updated_at BEFORE UPDATE ON postulaciones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
COMMIT;
