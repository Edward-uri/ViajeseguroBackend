BEGIN;

-- Backfill defensivo: filas sin correo no podrían pasar a NOT NULL.
UPDATE usuarios
   SET correo_electronico = 'sin-correo+' || id_usuario || '@placeholder.local'
 WHERE correo_electronico IS NULL;

ALTER TABLE usuarios ALTER COLUMN correo_electronico SET NOT NULL;
ALTER TABLE usuarios ALTER COLUMN telefono DROP NOT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) UNIQUE;

COMMIT;
