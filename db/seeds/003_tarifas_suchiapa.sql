DO $$
DECLARE muni BIGINT;
BEGIN
  SELECT id_municipio INTO muni FROM municipios WHERE nombre='Suchiapa' AND estado='Chiapas' LIMIT 1;
  IF muni IS NULL THEN RAISE NOTICE 'Suchiapa no existe; corre el seed 002 primero'; RETURN; END IF;

  -- Zonas con centroide para resolver "zona mas cercana" por GPS.
  -- Ancla: cabecera de Suchiapa 16.629444, -93.091667.
  -- ⚠️ Coordenadas APROXIMADAS (a nivel colonia): verificar/afinar en el panel admin.
  CREATE TEMP TABLE _z (nombre TEXT, precio NUMERIC, lat NUMERIC, lng NUMERIC) ON COMMIT DROP;
  INSERT INTO _z VALUES
    ('Centro',                                                12.00, 16.629444, -93.091667),
    ('La Condesa, Asunción, San Miguel, Arenal 2, Las Brisas',15.00, 16.63000,  -93.09500),
    ('Santa Fe',                                              25.00, 16.62500,  -93.08750),
    ('Cacho de Toro, Paraíso, El Triunfo',                    15.00, 16.63400,  -93.08800),
    ('San José (carretera San Luis)',                         25.00, 16.63850,  -93.09900),
    ('Rivera Buenavista',                                     20.00, 16.62050,  -93.09300),
    ('Riviera Nandayalu, El Cupape, Paso Pandayuco',          15.00, 16.61500,  -93.09750),
    ('Desvío del Otate',                                      20.00, 16.64200,  -93.08500),
    ('De Sur a Norte (puntos extremos)',                      15.00, 16.64500,  -93.09050);

  INSERT INTO zonas (id_municipio, nombre, lat_centro, lng_centro)
  SELECT muni, nombre, lat, lng FROM _z
  ON CONFLICT (id_municipio, nombre) DO NOTHING;

  -- Backfill de centroide para zonas ya creadas sin coords (no pisa ajustes hechos en el panel).
  UPDATE zonas z SET lat_centro = _z.lat, lng_centro = _z.lng
  FROM _z
  WHERE z.id_municipio = muni AND z.nombre = _z.nombre AND z.lat_centro IS NULL;

  INSERT INTO tarifas (id_municipio, id_zona, precio)
  SELECT muni, z.id_zona, _z.precio
  FROM _z JOIN zonas z ON z.id_municipio = muni AND z.nombre = _z.nombre
  WHERE NOT EXISTS (SELECT 1 FROM tarifas t WHERE t.id_zona = z.id_zona AND t.vigente);
END $$;
