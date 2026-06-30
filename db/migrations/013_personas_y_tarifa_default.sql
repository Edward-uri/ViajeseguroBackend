BEGIN;

-- Cobro por personas: mismo precio fijo por cada pasajero (mototaxi, 1 a 3).
ALTER TABLE viajes
  ADD COLUMN IF NOT EXISTS num_pasajeros SMALLINT NOT NULL DEFAULT 1
    CHECK (num_pasajeros BETWEEN 1 AND 3);

-- Precio fijo por defecto del municipio: se usa cuando no se resuelve una zona.
-- Configurable por municipio; evita precios calculados por km (con decimales).
ALTER TABLE municipios
  ADD COLUMN IF NOT EXISTS tarifa_default NUMERIC(8,2) NOT NULL DEFAULT 15.00;

COMMIT;
