INSERT INTO usuarios (telefono, correo_electronico, rol, telefono_verificado, correo_verificado)
VALUES ('9610000000', 'admin@jala.local', 'admin', TRUE, TRUE)
ON CONFLICT (correo_electronico) DO NOTHING;

INSERT INTO personas (id_persona, nombre, apellido_paterno)
SELECT id_usuario, 'Admin', 'Jala' FROM usuarios WHERE correo_electronico = 'admin@jala.local'
ON CONFLICT (id_persona) DO NOTHING;
