-- db/migrations/023_drop_usuarios_rol.sql
BEGIN;
-- Sweep final: cualquier usuario creado sin fila de roles mientras la columna existió.
INSERT INTO usuario_roles (id_usuario, rol)
SELECT id_usuario, rol FROM usuarios
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS idx_usuarios_rol;
ALTER TABLE usuarios DROP COLUMN IF EXISTS rol;
COMMIT;
