BEGIN;

-- Dos etiquetas de conductor que faltaban: elogio genérico y reportes de seguridad.
-- Antes, comentarios cortos como "bueno"/"bacano" o "me caí de la moto" quedaban sin
-- etiqueta porque ninguna del catálogo aplicaba (hueco de cobertura, no falla del modelo).
INSERT INTO etiquetas_catalogo (texto, rol, polaridad, descripcion) VALUES
  ('Buena experiencia', 'conductor', 'positiva', 'viaje agradable en general, sin queja concreta'),
  ('Viaje inseguro',    'conductor', 'negativa', 'accidente o situación de riesgo durante el viaje')
ON CONFLICT (rol, texto) DO NOTHING;

COMMIT;
