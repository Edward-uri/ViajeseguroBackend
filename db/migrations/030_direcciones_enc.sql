-- Columnas cifradas para direcciones_usuario (lat/lng/texto son PII de ubicación;
-- ya estaban registradas en SENSITIVE_FIELDS pero faltaban las columnas).
ALTER TABLE direcciones_usuario
  ADD COLUMN IF NOT EXISTS lat_enc   TEXT,
  ADD COLUMN IF NOT EXISTS lng_enc   TEXT,
  ADD COLUMN IF NOT EXISTS texto_enc TEXT;
