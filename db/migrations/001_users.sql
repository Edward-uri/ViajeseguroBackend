-- Migration: 001_users
-- Crea: ENUMs (rol_usuario, estado_cuenta), catalogo_sexo, usuarios, personas
-- Idempotente: usa IF NOT EXISTS donde es posible.

BEGIN;

-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUMs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
    CREATE TYPE rol_usuario AS ENUM ('pasajero', 'conductor', 'propietario', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_cuenta') THEN
    CREATE TYPE estado_cuenta AS ENUM ('activo', 'suspendido', 'eliminado');
  END IF;
END$$;

-- Funcion trigger para mantener updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Catalogo de sexo
CREATE TABLE IF NOT EXISTS catalogo_sexo (
  id_sexo  SMALLSERIAL PRIMARY KEY,
  sexo     VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO catalogo_sexo (sexo) VALUES
  ('Masculino'),
  ('Femenino'),
  ('Otro'),
  ('Prefiero no decir')
ON CONFLICT (sexo) DO NOTHING;

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario          BIGSERIAL PRIMARY KEY,
  nombre_usuario      VARCHAR(30)  NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,
  rol                 rol_usuario  NOT NULL,
  estado_cuenta       estado_cuenta NOT NULL DEFAULT 'activo',
  fecha_registro      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  foto_perfil_url     VARCHAR(500),
  foto_perfil_s3_key  VARCHAR(255),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol           ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado_cuenta ON usuarios(estado_cuenta);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS personas (
  id_persona          BIGINT      PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nombre              VARCHAR(30) NOT NULL,
  apellido_paterno    VARCHAR(30) NOT NULL,
  apellido_materno    VARCHAR(30),
  id_sexo             SMALLINT    REFERENCES catalogo_sexo(id_sexo),
  correo_electronico  VARCHAR(60) NOT NULL UNIQUE,
  telefono            VARCHAR(15),
  fecha_nacimiento    DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_correo ON personas(correo_electronico);

DROP TRIGGER IF EXISTS trg_personas_updated_at ON personas;
CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
