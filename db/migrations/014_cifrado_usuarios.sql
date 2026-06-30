BEGIN;

-- Cifrado de PII en usuarios: correo y teléfono pasan a columnas _enc (AES-GCM) + _bidx (HMAC).
-- Aditivo y reversible: las columnas planas se mantienen para la transición y se vacían en el
-- backfill (al arrancar). Una migración posterior las elimina una vez verificado.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS correo_electronico_enc  TEXT,
  ADD COLUMN IF NOT EXISTS correo_electronico_bidx TEXT,
  ADD COLUMN IF NOT EXISTS telefono_enc            TEXT,
  ADD COLUMN IF NOT EXISTS telefono_bidx           TEXT;

-- La unicidad pasa al blind index (determinista). Permite múltiples NULL (planas vacías).
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_correo_bidx
  ON usuarios(correo_electronico_bidx) WHERE correo_electronico_bidx IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_telefono_bidx
  ON usuarios(telefono_bidx) WHERE telefono_bidx IS NOT NULL;

-- Correo y teléfono planos dejan de ser obligatorios (los nuevos registros los guardan cifrados, plano NULL).
-- (correo_electronico se hizo NOT NULL en la migración 005; aquí se revierte porque ahora va cifrado.)
ALTER TABLE usuarios ALTER COLUMN correo_electronico DROP NOT NULL;
ALTER TABLE usuarios ALTER COLUMN telefono DROP NOT NULL;

COMMIT;
