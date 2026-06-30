-- Admin semilla para el panel.
-- Login: POST /api/auth/login/password  { correo: 'admin@jala.local', password: 'JalaAdmin2026' }
--
-- Idempotente y compatible con cifrado: se inserta SOLO si aún no existe ningún admin.
-- (Tras el cifrado, correo_electronico plano queda en NULL y la unicidad vive en correo_electronico_bidx,
--  así que un ON CONFLICT sobre el correo plano duplicaría el admin en cada arranque. Por eso se usa
--  NOT EXISTS por rol.) El backfill al boot cifra este correo y deja el login por blind index operativo.
INSERT INTO usuarios (telefono, correo_electronico, rol, telefono_verificado, correo_verificado, password_hash)
SELECT '9610000000', 'admin@jala.local', 'admin', TRUE, TRUE,
       '$2a$10$WKR/.WYysTR1qAXTMnRRiOGQmFccrkgqTZGfe9usImkoD2YDh0Rhq'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE rol = 'admin');

INSERT INTO personas (id_persona, nombre, apellido_paterno)
SELECT u.id_usuario, 'Admin', 'Jala'
FROM usuarios u
WHERE u.rol = 'admin'
  AND NOT EXISTS (SELECT 1 FROM personas p WHERE p.id_persona = u.id_usuario);
