-- db/migrations/020_usuario_roles.sql
BEGIN;

CREATE TABLE IF NOT EXISTS usuario_roles (
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  rol        rol_usuario NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, rol)
);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol);

-- Backfill 1: cada usuario conserva su rol actual.
INSERT INTO usuario_roles (id_usuario, rol)
SELECT id_usuario, rol FROM usuarios
ON CONFLICT DO NOTHING;

-- Backfill 2: todo no-admin puede además pedir viajes (rol pasajero universal).
INSERT INTO usuario_roles (id_usuario, rol)
SELECT id_usuario, 'pasajero'::rol_usuario FROM usuarios WHERE rol <> 'admin'
ON CONFLICT DO NOTHING;

COMMIT;
