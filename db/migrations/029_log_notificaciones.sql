-- Auditoría de envíos push (un registro por token notificado).
-- Sin RLS: la escribe el sistema al enviar; se consulta para diagnóstico/admin.
CREATE TABLE IF NOT EXISTS log_notificaciones (
  id_log        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario    BIGINT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  token_fcm     VARCHAR(255) NOT NULL,
  titulo        VARCHAR(255) NOT NULL,
  estado        VARCHAR(20)  NOT NULL CHECK (estado IN ('enviado', 'fallido', 'token_invalido')),
  error_detalle VARCHAR(500),
  contexto      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_log_notif_usuario ON log_notificaciones(id_usuario, created_at DESC);
