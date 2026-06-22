BEGIN;

CREATE TABLE IF NOT EXISTS asignaciones_conductor_vehiculo (
  id_asignacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vehiculo   BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  id_conductor  BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_asignacion_activa
  ON asignaciones_conductor_vehiculo(id_vehiculo, id_conductor) WHERE activo;
CREATE INDEX IF NOT EXISTS idx_asignacion_conductor_activa
  ON asignaciones_conductor_vehiculo(id_conductor) WHERE activo;
DROP TRIGGER IF EXISTS trg_asignaciones_updated_at ON asignaciones_conductor_vehiculo;
CREATE TRIGGER trg_asignaciones_updated_at BEFORE UPDATE ON asignaciones_conductor_vehiculo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
