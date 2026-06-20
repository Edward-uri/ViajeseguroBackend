BEGIN;

CREATE TABLE IF NOT EXISTS municipios (
  id_municipio BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       VARCHAR(80) NOT NULL,
  estado       VARCHAR(80) NOT NULL,
  activo       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nombre, estado)
);
CREATE INDEX IF NOT EXISTS idx_municipios_activo ON municipios(activo);
DROP TRIGGER IF EXISTS trg_municipios_updated_at ON municipios;
CREATE TRIGGER trg_municipios_updated_at BEFORE UPDATE ON municipios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Municipio preferido / de registro del usuario (suave: solo UX y analitica, no restringe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_municipio BIGINT REFERENCES municipios(id_municipio);
CREATE INDEX IF NOT EXISTS idx_usuarios_municipio ON usuarios(id_municipio);

-- Municipio operativo del conductor (donde trabaja). Obligatorio a nivel de aplicacion
-- al dar de alta la licencia; nullable en BD porque la fila puede crearse antes (subir documento).
ALTER TABLE conductores ADD COLUMN IF NOT EXISTS id_municipio BIGINT REFERENCES municipios(id_municipio);
CREATE INDEX IF NOT EXISTS idx_conductores_municipio ON conductores(id_municipio);

COMMIT;
