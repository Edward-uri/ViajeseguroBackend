BEGIN;

-- OTP: el destino (correo/teléfono) pasa a cifrado + blind index.
ALTER TABLE codigos_otp
  ADD COLUMN IF NOT EXISTS destino_enc  TEXT,
  ADD COLUMN IF NOT EXISTS destino_bidx TEXT;
CREATE INDEX IF NOT EXISTS idx_otp_destino_bidx ON codigos_otp(destino_bidx);
ALTER TABLE codigos_otp ALTER COLUMN destino DROP NOT NULL;

-- Invitaciones admin: el correo pasa a cifrado + blind index.
ALTER TABLE invitaciones_admin
  ADD COLUMN IF NOT EXISTS correo_enc  TEXT,
  ADD COLUMN IF NOT EXISTS correo_bidx TEXT;
CREATE INDEX IF NOT EXISTS idx_invitaciones_correo_bidx ON invitaciones_admin(correo_bidx);
ALTER TABLE invitaciones_admin ALTER COLUMN correo DROP NOT NULL;

COMMIT;
