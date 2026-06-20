INSERT INTO municipios (nombre, estado, activo)
VALUES ('Suchiapa', 'Chiapas', TRUE)
ON CONFLICT (nombre, estado) DO NOTHING;
