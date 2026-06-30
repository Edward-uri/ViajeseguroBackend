BEGIN;

-- personas: nombre/apellidos/fecha_nac -> solo cifrado (sin blind index, no se busca por ellos).
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS nombre_enc           TEXT,
  ADD COLUMN IF NOT EXISTS apellido_paterno_enc TEXT,
  ADD COLUMN IF NOT EXISTS apellido_materno_enc TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento_enc TEXT;

-- Los nuevos registros guardan el nombre cifrado (plano NULL).
ALTER TABLE personas ALTER COLUMN nombre DROP NOT NULL;
ALTER TABLE personas ALTER COLUMN apellido_paterno DROP NOT NULL;

COMMIT;
