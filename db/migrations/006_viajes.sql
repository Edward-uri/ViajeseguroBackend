BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estado_viaje') THEN
    CREATE TYPE estado_viaje AS ENUM ('solicitado','aceptado','en_curso','completado','cancelado'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_servicio_viaje') THEN
    CREATE TYPE tipo_servicio_viaje AS ENUM ('viaje','envio'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='plataforma_dispositivo') THEN
    CREATE TYPE plataforma_dispositivo AS ENUM ('android','ios'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_evaluacion') THEN
    CREATE TYPE tipo_evaluacion AS ENUM ('pasajero_a_conductor','conductor_a_pasajero'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='cancelado_por') THEN
    CREATE TYPE cancelado_por AS ENUM ('pasajero','conductor','sistema'); END IF;
END $$;

CREATE TABLE IF NOT EXISTS zonas (
  id_zona      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_municipio BIGINT NOT NULL REFERENCES municipios(id_municipio),
  nombre       VARCHAR(120) NOT NULL,
  lat_centro   DECIMAL(10,8),
  lng_centro   DECIMAL(11,8),
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (id_municipio, nombre)
);

CREATE TABLE IF NOT EXISTS tarifas (
  id_tarifa    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_municipio BIGINT NOT NULL REFERENCES municipios(id_municipio),
  id_zona      BIGINT NOT NULL REFERENCES zonas(id_zona),
  precio       NUMERIC(8,2) NOT NULL,
  vigente      BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tarifa_zona_vigente ON tarifas(id_zona) WHERE vigente;

CREATE TABLE IF NOT EXISTS viajes (
  id_viaje        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pasajero     BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_conductor    BIGINT REFERENCES conductores(id_conductor),
  id_vehiculo     BIGINT REFERENCES vehiculos(id_vehiculo),
  id_municipio    BIGINT NOT NULL REFERENCES municipios(id_municipio),
  tipo_servicio   tipo_servicio_viaje NOT NULL DEFAULT 'viaje',
  origen_lat      DECIMAL(10,8), origen_lng DECIMAL(11,8), origen_texto VARCHAR(255),
  destino_lat     DECIMAL(10,8), destino_lng DECIMAL(11,8), destino_texto VARCHAR(255),
  id_zona_destino BIGINT REFERENCES zonas(id_zona),
  distancia_km    NUMERIC(6,2),
  tarifa          NUMERIC(8,2) NOT NULL,
  tarifa_estimada BOOLEAN NOT NULL DEFAULT FALSE,
  estado          estado_viaje NOT NULL DEFAULT 'solicitado',
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_aceptacion TIMESTAMPTZ, fecha_inicio TIMESTAMPTZ, fecha_fin TIMESTAMPTZ,
  cancelado_por   cancelado_por, motivo_cancelacion VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_viajes_pasajero ON viajes(id_pasajero);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes(estado);
CREATE INDEX IF NOT EXISTS idx_viajes_municipio_fecha ON viajes(id_municipio, fecha_solicitud);
DROP TRIGGER IF EXISTS trg_viajes_updated_at ON viajes;
CREATE TRIGGER trg_viajes_updated_at BEFORE UPDATE ON viajes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS viaje_estado_historial (
  id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_viaje     BIGINT NOT NULL REFERENCES viajes(id_viaje) ON DELETE CASCADE,
  estado       estado_viaje NOT NULL,
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rastreo_ubicacion (
  id_rastreo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_viaje   BIGINT NOT NULL REFERENCES viajes(id_viaje) ON DELETE CASCADE,
  lat        DECIMAL(10,8) NOT NULL, lng DECIMAL(11,8) NOT NULL,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rastreo_viaje_fecha ON rastreo_ubicacion(id_viaje, fecha);

CREATE TABLE IF NOT EXISTS evaluaciones (
  id_evaluacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_viaje      BIGINT NOT NULL REFERENCES viajes(id_viaje) ON DELETE CASCADE,
  id_evaluador  BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_evaluado   BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  tipo          tipo_evaluacion NOT NULL,
  calificacion  SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario    TEXT,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_viaje, tipo)
);

CREATE TABLE IF NOT EXISTS dispositivos (
  id_dispositivo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario     BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token_fcm      VARCHAR(255) NOT NULL UNIQUE,
  plataforma     plataforma_dispositivo NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS direcciones_usuario (
  id_direccion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario   BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  etiqueta     VARCHAR(40), lat DECIMAL(10,8), lng DECIMAL(11,8), texto VARCHAR(255),
  es_favorita  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
