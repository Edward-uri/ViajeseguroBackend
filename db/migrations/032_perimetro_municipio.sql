-- Límite administrativo del municipio (GeoJSON Polygon/MultiPolygon, [lng,lat]).
-- Con él, los viajes se validan por point-in-polygon (preciso); sin él, se usa
-- el fallback de radio a centroides. Se carga con scripts/cargar-perimetro.mjs.
ALTER TABLE municipios ADD COLUMN IF NOT EXISTS perimetro JSONB;
