-- Atributos estructurados de la vacante (bolsa de flotillas).
-- Antes solo había `condiciones` (texto libre). Ahora la oferta de renta lleva:
-- tipo de turno, renta por turno (MXN), días que se trabaja y horario opcional.
-- `condiciones` se reusa como "información adicional".
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_turno_vacante') THEN
    CREATE TYPE tipo_turno_vacante AS ENUM ('completo','matutino','vespertino','nocturno'); END IF;
END $$;

ALTER TABLE vacantes
  ADD COLUMN IF NOT EXISTS tipo_turno  tipo_turno_vacante NOT NULL DEFAULT 'completo',
  ADD COLUMN IF NOT EXISTS renta_turno NUMERIC(10,2)      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dias        TEXT[]             NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS horario     TEXT;
COMMIT;
