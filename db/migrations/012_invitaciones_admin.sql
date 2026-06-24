CREATE TABLE IF NOT EXISTS invitaciones_admin (
  id_invitacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correo        VARCHAR(60) NOT NULL,
  token_hash    VARCHAR(64) NOT NULL UNIQUE,           -- sha256 hex del token
  invitado_por  BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  estado        VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente | aceptada | revocada
  expira_en     TIMESTAMPTZ NOT NULL,
  aceptada_en   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitaciones_correo ON invitaciones_admin(correo);
-- máximo una invitación PENDIENTE por correo (para el reenvío idempotente)
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitacion_pendiente
  ON invitaciones_admin(correo) WHERE estado = 'pendiente';
DROP TRIGGER IF EXISTS trg_invitaciones_updated_at ON invitaciones_admin;
CREATE TRIGGER trg_invitaciones_updated_at BEFORE UPDATE ON invitaciones_admin
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
