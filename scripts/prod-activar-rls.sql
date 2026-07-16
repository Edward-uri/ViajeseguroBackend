DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'viajeseguro_app') THEN
    CREATE ROLE viajeseguro_app LOGIN;
  END IF;
END $$;

DO $$ BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO viajeseguro_app', current_database());
END $$;
GRANT USAGE, CREATE ON SCHEMA public TO viajeseguro_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO viajeseguro_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO viajeseguro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO viajeseguro_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO viajeseguro_app;


DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO viajeseguro_app', r.tablename);
  END LOOP;
  FOR r IN SELECT t.typname FROM pg_type t
             JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public' AND t.typtype = 'e' LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO viajeseguro_app', r.typname);
  END LOOP;
  FOR r IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
             FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO viajeseguro_app', r.proname, r.args);
  END LOOP;
END $$;

-- ---------- 3) Data checks: TODOS deben dar 0 antes del switch ----------
-- 3a. Usuarios operativos sin municipio → con RLS verían 0 datos (no podrían operar).
SELECT 'usuarios operativos sin municipio' AS chequeo, ur.rol, count(*)
  FROM usuarios u
  JOIN usuario_roles ur ON ur.id_usuario = u.id_usuario
 WHERE u.id_municipio IS NULL AND ur.rol <> 'admin' AND u.estado_cuenta = 'activo'
 GROUP BY ur.rol;

-- 3b. Conductores cuyo municipio difiere del de su usuario (token vs fila).
SELECT 'conductores municipio distinto a su usuario' AS chequeo, count(*)
  FROM conductores c
  JOIN usuarios u ON u.id_usuario = c.id_conductor
 WHERE c.id_municipio IS DISTINCT FROM u.id_municipio;

-- 3c. Viajes con conductor de otro municipio (histórico cruzado).
SELECT 'viajes con conductor de otro municipio' AS chequeo, count(*)
  FROM viajes v
  JOIN conductores c ON c.id_conductor = v.id_conductor
 WHERE c.id_municipio IS DISTINCT FROM v.id_municipio;

-- 3d. Vehículos cuyo propietario (usuario) es de otro municipio.
SELECT 'vehiculos con propietario de otro municipio' AS chequeo, count(*)
  FROM vehiculos ve
  JOIN usuarios u ON u.id_usuario = ve.id_propietario
 WHERE u.id_municipio IS DISTINCT FROM ve.id_municipio;
