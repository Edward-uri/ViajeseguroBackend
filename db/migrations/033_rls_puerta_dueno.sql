-- Puerta de dueño/conductor en RLS.
--
-- Bug (flotillas): el tenant de RLS sale de usuarios.id_municipio, un campo
-- BLANDO (003 lo documenta como "solo UX, no restringe") y a veces NULL en el
-- token (registro sin municipio, municipio puesto después → token viejo, o
-- cuentas admin/propietario sin municipio). Cuando el tenant es NULL/distinto,
-- RLS le ocultaba al dueño su PROPIA vacante y, en cascada, sus postulaciones
-- (la política de postulaciones exige poder ver la vacante padre).
--
-- Fix ADITIVO: el dueño ve/gestiona sus vacantes por id_propietario y el
-- conductor sus postulaciones por id_conductor, sin depender del municipio.
-- app.user_id lo setea el backend (core/db.ts) con el `sub` del JWT.
-- No le quita acceso a nadie (solo agrega ramas OR). Como las políticas no
-- declaran WITH CHECK, el USING también aplica al INSERT/UPDATE: esto además
-- arregla el "crear vacante / postular se rompía en silencio" por el mismo
-- desajuste de municipio.

DROP POLICY IF EXISTS vacantes_tenant ON vacantes;
CREATE POLICY vacantes_tenant ON vacantes
  USING (
    current_setting('app.is_admin', true) = 'on'
    OR id_municipio = NULLIF(current_setting('app.tenant_id', true), '')::bigint
    OR id_propietario = NULLIF(current_setting('app.user_id', true), '')::bigint
  );

DROP POLICY IF EXISTS postulaciones_tenant ON postulaciones;
CREATE POLICY postulaciones_tenant ON postulaciones
  USING (
    EXISTS (SELECT 1 FROM vacantes va WHERE va.id_vacante = postulaciones.id_vacante)
    OR id_conductor = NULLIF(current_setting('app.user_id', true), '')::bigint
  );
