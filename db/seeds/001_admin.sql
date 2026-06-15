INSERT INTO usuarios (telefono, correo_electronico, rol, telefono_verificado, correo_verificado)
VALUES ('9610000000', 'admin@jala.local', 'admin', TRUE, TRUE)
ON CONFLICT (telefono) DO NOTHING;

INSERT INTO personas (id_persona, nombre, apellido_paterno)
SELECT id_usuario, 'Admin', 'Jala' FROM usuarios WHERE telefono = '9610000000'
ON CONFLICT (id_persona) DO NOTHING;
