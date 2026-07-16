-- RLS por tenant (municipio) en viajes — primera tabla del rollout F2.
-- El contexto app.tenant_id / app.is_admin lo publica core/db.ts por request (SET LOCAL).
-- Sin contexto (scripts, rutas públicas): cero filas — falla cerrado, nunca fuga.

ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
-- FORCE: el usuario de la app es dueño de la tabla; sin esto la política no le aplicaría.
ALTER TABLE viajes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS viajes_tenant ON viajes;
CREATE POLICY viajes_tenant ON viajes
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_municipio = NULLIF(current_setting('app.tenant_id', true), '')::bigint
  );
-- Sin WITH CHECK explícito hereda el USING: un INSERT/UPDATE que cruce de municipio
-- (id_municipio ≠ tenant del token) se rechaza, salvo admin.
