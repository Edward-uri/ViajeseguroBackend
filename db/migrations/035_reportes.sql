-- Reportes bidireccionales + bloqueo mutuo (derivado de esta tabla).
-- 1 reporte entre A y B (en cualquier dirección) => par bloqueado permanentemente.
-- El conteo de reportes con rol_reportado='conductor' alimenta el veto del admin.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='rol_reportado') THEN
    CREATE TYPE rol_reportado AS ENUM ('conductor','pasajero'); END IF;
END $$;

CREATE TABLE IF NOT EXISTS reportes (
  id_reporte     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_viaje       BIGINT REFERENCES viajes(id_viaje),
  id_reportante  BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_reportado   BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  rol_reportado  rol_reportado NOT NULL,
  motivo         TEXT NOT NULL,
  comentario     TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reportes_no_auto CHECK (id_reportante <> id_reportado),
  CONSTRAINT reportes_unico_por_direccion UNIQUE (id_reportante, id_reportado)
);
CREATE INDEX IF NOT EXISTS ix_reportes_reportado ON reportes (id_reportado, rol_reportado);
CREATE INDEX IF NOT EXISTS ix_reportes_reportante ON reportes (id_reportante);

-- RLS: las dos personas del par ven el reporte (para el chequeo de bloqueo) y el
-- admin ve todo. Usa app.user_id (la misma "puerta de dueño" de la migración 033).
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reportes_tenant ON reportes;
CREATE POLICY reportes_tenant ON reportes
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_reportante = NULLIF(current_setting('app.user_id', true), '')::bigint
    OR id_reportado  = NULLIF(current_setting('app.user_id', true), '')::bigint
  );
COMMIT;
