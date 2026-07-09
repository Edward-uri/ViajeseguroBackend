-- db/migrations/021_vehiculo_activo.sql
BEGIN;
ALTER TABLE conductores
  ADD COLUMN IF NOT EXISTS id_vehiculo_activo BIGINT REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL;
COMMIT;
