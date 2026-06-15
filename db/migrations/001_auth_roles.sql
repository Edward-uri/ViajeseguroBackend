BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='rol_usuario') THEN
    CREATE TYPE rol_usuario AS ENUM ('pasajero','conductor','propietario','admin'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='estado_cuenta') THEN
    CREATE TYPE estado_cuenta AS ENUM ('activo','suspendido','eliminado'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='canal_otp') THEN
    CREATE TYPE canal_otp AS ENUM ('sms','email'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='proposito_otp') THEN
    CREATE TYPE proposito_otp AS ENUM ('registro','login'); END IF;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS catalogo_sexo (
  id_sexo SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sexo    VARCHAR(20) NOT NULL UNIQUE
);
INSERT INTO catalogo_sexo (sexo) VALUES ('Masculino'),('Femenino'),('Otro'),('Prefiero no decir')
ON CONFLICT (sexo) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  telefono            VARCHAR(15)   NOT NULL UNIQUE,
  correo_electronico  VARCHAR(60)   UNIQUE,
  telefono_verificado BOOLEAN       NOT NULL DEFAULT FALSE,
  correo_verificado   BOOLEAN       NOT NULL DEFAULT FALSE,
  rol                 rol_usuario   NOT NULL DEFAULT 'pasajero',
  estado_cuenta       estado_cuenta NOT NULL DEFAULT 'activo',
  foto_perfil_url     VARCHAR(500),
  foto_perfil_s3_key  VARCHAR(255),
  fecha_registro      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado_cuenta);
DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS personas (
  id_persona        BIGINT PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nombre            VARCHAR(30) NOT NULL,
  apellido_paterno  VARCHAR(30) NOT NULL,
  apellido_materno  VARCHAR(30),
  id_sexo           SMALLINT REFERENCES catalogo_sexo(id_sexo),
  fecha_nacimiento  DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_personas_updated_at ON personas;
CREATE TRIGGER trg_personas_updated_at BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS codigos_otp (
  id_codigo   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario  BIGINT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  destino     VARCHAR(60)   NOT NULL,
  canal       canal_otp     NOT NULL,
  proposito   proposito_otp NOT NULL,
  codigo_hash VARCHAR(255)  NOT NULL,
  expira_en   TIMESTAMPTZ   NOT NULL,
  intentos    SMALLINT      NOT NULL DEFAULT 0,
  usado_en    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_destino_prop ON codigos_otp(destino, proposito);

CREATE TABLE IF NOT EXISTS sesiones (
  id_sesion    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_usuario   BIGINT       NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  refresh_hash VARCHAR(255) NOT NULL,
  dispositivo  VARCHAR(255),
  expira_en    TIMESTAMPTZ  NOT NULL,
  revocada_en  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(id_usuario);

COMMIT;
