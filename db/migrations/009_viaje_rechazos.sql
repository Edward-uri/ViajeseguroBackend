BEGIN;

CREATE TABLE IF NOT EXISTS viaje_rechazos (
  id_viaje     BIGINT NOT NULL REFERENCES viajes(id_viaje) ON DELETE CASCADE,
  id_conductor BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_viaje, id_conductor)
);
CREATE INDEX IF NOT EXISTS idx_viaje_rechazos_conductor ON viaje_rechazos(id_conductor);

COMMIT;
