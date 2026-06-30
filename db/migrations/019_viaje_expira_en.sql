BEGIN;

ALTER TABLE viajes ADD COLUMN IF NOT EXISTS expira_en TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_viajes_expira_en ON viajes(expira_en)
  WHERE estado = 'solicitado' AND expira_en IS NOT NULL;

COMMIT;
