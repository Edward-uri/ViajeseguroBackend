-- Centroide por zona para resolver "zona mas cercana" por GPS.
-- Ancla: cabecera de Suchiapa 16.629444, -93.091667.
-- ⚠️ Coordenadas APROXIMADAS (a nivel colonia): verificar/afinar en el panel admin.
-- Idempotente: solo rellena zonas sin coords (no pisa ajustes hechos en el panel).
DO $$
DECLARE muni BIGINT;
BEGIN
  SELECT id_municipio INTO muni FROM municipios WHERE nombre='Suchiapa' AND estado='Chiapas' LIMIT 1;
  IF muni IS NULL THEN RAISE NOTICE 'Suchiapa no existe; corre el seed 002 primero'; RETURN; END IF;

  UPDATE zonas z SET lat_centro = v.lat, lng_centro = v.lng
  FROM (VALUES
    ('Centro',                                                16.629444, -93.091667),
    ('La Condesa, Asunción, San Miguel, Arenal 2, Las Brisas',16.63000,  -93.09500),
    ('Santa Fe',                                              16.62500,  -93.08750),
    ('Cacho de Toro, Paraíso, El Triunfo',                    16.63400,  -93.08800),
    ('San José (carretera San Luis)',                         16.63850,  -93.09900),
    ('Rivera Buenavista',                                     16.62050,  -93.09300),
    ('Riviera Nandayalu, El Cupape, Paso Pandayuco',          16.61500,  -93.09750),
    ('Desvío del Otate',                                      16.64200,  -93.08500),
    ('De Sur a Norte (puntos extremos)',                      16.64500,  -93.09050)
  ) AS v(nombre, lat, lng)
  WHERE z.id_municipio = muni AND z.nombre = v.nombre AND z.lat_centro IS NULL;
END $$;
