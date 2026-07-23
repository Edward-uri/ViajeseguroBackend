BEGIN;

-- Número de serie (VIN/serie del mototaxi): identifica de forma única cada unidad.
-- ponytail: se guarda en claro (a diferencia de la placa, cifrada + blind index).
-- Si más adelante debe ser no-buscable, migrar a numero_serie_enc + _bidx.
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- Único cuando está presente; NULL permitido para los ya registrados (no rompe lo existente).
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehiculos_numero_serie
  ON vehiculos (numero_serie) WHERE numero_serie IS NOT NULL;

COMMIT;
