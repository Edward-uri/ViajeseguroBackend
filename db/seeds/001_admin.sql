-- Admin semilla para el panel.
-- Login: POST /api/auth/login/password  { correo: 'admin@jala.local', password: 'JalaAdmin2026' }
--
-- Idempotente y compatible con cifrado: se inserta SOLO si aún no existe ningún admin
-- (NOT EXISTS por rol en usuario_roles — la columna usuarios.rol ya no se lee/escribe aquí).
-- Tras el cifrado, correo_electronico plano queda en NULL, así que el resto de las filas
-- (usuario_roles, personas) se encadenan por RETURNING del INSERT en usuarios: solo corren
-- en la corrida que sí inserta; en corridas posteriores el admin ya existe completo y no hay
-- correo plano fiable para volver a localizarlo. El backfill al boot cifra el correo y deja
-- el login por blind index operativo.
WITH nuevo_admin AS (
  INSERT INTO usuarios (telefono, correo_electronico, telefono_verificado, correo_verificado, password_hash)
  SELECT '9610000000', 'admin@jala.local', TRUE, TRUE,
         '$2a$10$WKR/.WYysTR1qAXTMnRRiOGQmFccrkgqTZGfe9usImkoD2YDh0Rhq'
  WHERE NOT EXISTS (SELECT 1 FROM usuario_roles WHERE rol = 'admin')
  RETURNING id_usuario
),
nuevo_rol AS (
  INSERT INTO usuario_roles (id_usuario, rol)
  SELECT id_usuario, 'admin' FROM nuevo_admin
  RETURNING id_usuario
)
INSERT INTO personas (id_persona, nombre, apellido_paterno)
SELECT id_usuario, 'Admin', 'Jala' FROM nuevo_rol;
