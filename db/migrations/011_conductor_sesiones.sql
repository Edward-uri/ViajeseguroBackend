BEGIN;

CREATE TABLE IF NOT EXISTS conductor_sesiones (
  id_sesion    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_conductor BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  inicio       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fin          TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sesion_abierta
  ON conductor_sesiones(id_conductor) WHERE fin IS NULL;
CREATE INDEX IF NOT EXISTS idx_sesiones_conductor_inicio
  ON conductor_sesiones(id_conductor, inicio);

COMMIT;
