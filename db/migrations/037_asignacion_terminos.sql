BEGIN;

-- Términos de la relación laboral en la propia asignación.
-- Al aceptar una postulación la vacante se cierra, así que la asignación pasa a
-- ser la fuente de verdad del turno/renta/días/horario del conductor. Todo NULL:
-- las asignaciones 'propia' (alta manual del dueño) no traen estos términos.
-- Reusa el enum tipo_turno_vacante creado en 034.
ALTER TABLE asignaciones_conductor_vehiculo
  ADD COLUMN IF NOT EXISTS tipo_turno  tipo_turno_vacante,
  ADD COLUMN IF NOT EXISTS renta_turno NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dias        TEXT[],
  ADD COLUMN IF NOT EXISTS horario     TEXT;

COMMIT;
