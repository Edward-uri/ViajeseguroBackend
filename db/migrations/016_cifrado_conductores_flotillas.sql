BEGIN;

-- conductores.licencia -> cifrado + blind index
ALTER TABLE conductores
  ADD COLUMN IF NOT EXISTS licencia_enc  TEXT,
  ADD COLUMN IF NOT EXISTS licencia_bidx TEXT;
CREATE INDEX IF NOT EXISTS idx_conductores_licencia_bidx ON conductores(licencia_bidx);

-- vehiculos.placa (era NOT NULL UNIQUE) -> cifrado + blind index; unicidad pasa al bidx
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS placa_enc  TEXT,
  ADD COLUMN IF NOT EXISTS placa_bidx TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehiculos_placa_bidx
  ON vehiculos(placa_bidx) WHERE placa_bidx IS NOT NULL;
ALTER TABLE vehiculos ALTER COLUMN placa DROP NOT NULL;

-- propietarios.rfc (cifrado + bidx) y razon_social (solo cifrado)
ALTER TABLE propietarios
  ADD COLUMN IF NOT EXISTS rfc_enc          TEXT,
  ADD COLUMN IF NOT EXISTS rfc_bidx         TEXT,
  ADD COLUMN IF NOT EXISTS razon_social_enc TEXT;
CREATE INDEX IF NOT EXISTS idx_propietarios_rfc_bidx ON propietarios(rfc_bidx);

COMMIT;
