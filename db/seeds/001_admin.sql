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
