BEGIN;

-- Catálogo de etiquetas de reputación (los textos los administra el equipo con UPDATE/INSERT).
CREATE TABLE IF NOT EXISTS etiquetas_catalogo (
  id_etiqueta BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  texto       VARCHAR(40) NOT NULL,
  rol         VARCHAR(12) NOT NULL CHECK (rol IN ('conductor','pasajero')),
  polaridad   VARCHAR(10) NOT NULL CHECK (polaridad IN ('positiva','negativa')),
  descripcion VARCHAR(120) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (rol, texto)
);

-- Etiquetas inferidas por LLM-JALA para cada evaluación.
CREATE TABLE IF NOT EXISTS evaluacion_etiquetas (
  id_evaluacion BIGINT NOT NULL REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE,
  id_etiqueta   BIGINT NOT NULL REFERENCES etiquetas_catalogo(id_etiqueta),
  PRIMARY KEY (id_evaluacion, id_etiqueta)
);

ALTER TABLE evaluaciones ADD COLUMN IF NOT EXISTS nlp_procesado_en TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_evaluaciones_nlp_pendientes
  ON evaluaciones(id_evaluacion) WHERE nlp_procesado_en IS NULL;

INSERT INTO etiquetas_catalogo (texto, rol, polaridad, descripcion) VALUES
  ('Buen manejo',        'conductor', 'positiva', 'conduce con suavidad y seguridad'),
  ('Unidad limpia',      'conductor', 'positiva', 'el vehículo estaba limpio y en buen estado'),
  ('Trato amable',       'conductor', 'positiva', 'fue cortés, respetuoso y agradable'),
  ('Puntual',            'conductor', 'positiva', 'llegó a tiempo al punto de encuentro'),
  ('Conoce las rutas',   'conductor', 'positiva', 'tomó buenas rutas sin rodeos'),
  ('Manejo brusco',      'conductor', 'negativa', 'acelerones, frenados o manejo inseguro'),
  ('Unidad en mal estado','conductor','negativa', 'vehículo sucio o descuidado'),
  ('Trato descortés',    'conductor', 'negativa', 'fue grosero, cortante o incómodo'),
  ('Impuntual',          'conductor', 'negativa', 'llegó tarde o hizo esperar'),
  ('Ruta inadecuada',    'conductor', 'negativa', 'dio rodeos o se perdió'),
  ('Puntual',            'pasajero',  'positiva', 'estaba listo en el punto de encuentro'),
  ('Trato amable',       'pasajero',  'positiva', 'fue cortés y respetuoso'),
  ('Cuida la unidad',    'pasajero',  'positiva', 'dejó el vehículo como lo encontró'),
  ('Impuntual',          'pasajero',  'negativa', 'hizo esperar al conductor'),
  ('Trato descortés',    'pasajero',  'negativa', 'fue grosero o irrespetuoso'),
  ('No cuidó la unidad', 'pasajero',  'negativa', 'ensució o maltrató el vehículo')
ON CONFLICT (rol, texto) DO NOTHING;

COMMIT;
