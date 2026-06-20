BEGIN;

CREATE TABLE IF NOT EXISTS conductor_disponibilidad (
  id_conductor   BIGINT PRIMARY KEY REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  disponible     BOOLEAN NOT NULL DEFAULT FALSE,
  lat            DECIMAL(10,8),
  lng            DECIMAL(11,8),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
