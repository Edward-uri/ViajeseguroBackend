-- RLS por tenant (municipio) — segunda tanda: vehiculos, conductores, vacantes.
-- Mismo patrón que 025 (viajes). zonas/tarifas quedan SIN RLS a propósito:
-- son catálogo público (GET /api/municipios/:id/tarifas no lleva auth).

ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehiculos_tenant ON vehiculos;
CREATE POLICY vehiculos_tenant ON vehiculos
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_municipio = NULLIF(current_setting('app.tenant_id', true), '')::bigint
  );

ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conductores_tenant ON conductores;
CREATE POLICY conductores_tenant ON conductores
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_municipio = NULLIF(current_setting('app.tenant_id', true), '')::bigint
  );

ALTER TABLE vacantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacantes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vacantes_tenant ON vacantes;
CREATE POLICY vacantes_tenant ON vacantes
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_municipio = NULLIF(current_setting('app.tenant_id', true), '')::bigint
  );
