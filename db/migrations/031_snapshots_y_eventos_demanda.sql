-- Señales para el modelo ML de zonas calientes que hoy no se persisten:
--  1) historial de oferta (snapshots periódicos de conductor_disponibilidad),
--  2) demanda no atendida (aperturas de solicitud / cotizaciones del pasajero).
-- Sin RLS a propósito: son series de tiempo agregadas que ml_reader lee cross-tenant.

BEGIN;

-- 1) Historial de oferta. conductor_disponibilidad es snapshot ACTUAL (se sobreescribe);
--    el job copia aquí una foto cada 5 min para reconstruir la oferta en el tiempo.
CREATE TABLE IF NOT EXISTS conductor_disponibilidad_snapshot (
  id_snapshot  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_conductor BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  disponible   BOOLEAN NOT NULL,
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cds_fecha ON conductor_disponibilidad_snapshot(fecha);
CREATE INDEX IF NOT EXISTS idx_cds_conductor_fecha ON conductor_disponibilidad_snapshot(id_conductor, fecha);

-- 2) Demanda: pasajeros que abren la pantalla de solicitar (o cotizan) sin pedir viaje.
CREATE TABLE IF NOT EXISTS eventos_demanda (
  id_evento                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario                BIGINT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  tipo                      VARCHAR(30) NOT NULL CHECK (tipo IN ('apertura_solicitud','cotizacion')),
  lat                       DECIMAL(10,8) NOT NULL,
  lng                       DECIMAL(11,8) NOT NULL,
  id_municipio              BIGINT REFERENCES municipios(id_municipio),
  n_conductores_disponibles SMALLINT,
  fecha                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_eventos_demanda_fecha ON eventos_demanda(fecha);
CREATE INDEX IF NOT EXISTS idx_eventos_demanda_municipio_fecha ON eventos_demanda(id_municipio, fecha);

-- ml_reader puede no existir aún en algunos entornos: solo concede si el rol está creado.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ml_reader') THEN
    GRANT SELECT ON conductor_disponibilidad_snapshot TO ml_reader;
    GRANT SELECT ON eventos_demanda TO ml_reader;
  END IF;
END $$;

COMMIT;
