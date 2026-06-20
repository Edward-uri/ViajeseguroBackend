DO $$
DECLARE muni BIGINT;
BEGIN
  SELECT id_municipio INTO muni FROM municipios WHERE nombre='Suchiapa' AND estado='Chiapas' LIMIT 1;
  IF muni IS NULL THEN RAISE NOTICE 'Suchiapa no existe; corre el seed 002 primero'; RETURN; END IF;

  INSERT INTO zonas (id_municipio, nombre) VALUES
    (muni,'Centro'),
    (muni,'La Condesa, Asunción, San Miguel, Arenal 2, Las Brisas'),
    (muni,'Santa Fe'),
    (muni,'Cacho de Toro, Paraíso, El Triunfo'),
    (muni,'San José (carretera San Luis)'),
    (muni,'Rivera Buenavista'),
    (muni,'Riviera Nandayalu, El Cupape, Paso Pandayuco'),
    (muni,'Desvío del Otate'),
    (muni,'De Sur a Norte (puntos extremos)')
  ON CONFLICT (id_municipio, nombre) DO NOTHING;

  INSERT INTO tarifas (id_municipio, id_zona, precio)
  SELECT muni, z.id_zona, v.precio
  FROM (VALUES
    ('Centro', 12.00),
    ('La Condesa, Asunción, San Miguel, Arenal 2, Las Brisas', 15.00),
    ('Santa Fe', 25.00),
    ('Cacho de Toro, Paraíso, El Triunfo', 15.00),
    ('San José (carretera San Luis)', 25.00),
    ('Rivera Buenavista', 20.00),
    ('Riviera Nandayalu, El Cupape, Paso Pandayuco', 15.00),
    ('Desvío del Otate', 20.00),
    ('De Sur a Norte (puntos extremos)', 15.00)
  ) AS v(nombre, precio)
  JOIN zonas z ON z.id_municipio = muni AND z.nombre = v.nombre
  WHERE NOT EXISTS (SELECT 1 FROM tarifas t WHERE t.id_zona = z.id_zona AND t.vigente);
END $$;
