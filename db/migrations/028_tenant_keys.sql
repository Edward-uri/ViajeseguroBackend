CREATE TABLE IF NOT EXISTS tenant_keys (
  id_municipio  BIGINT PRIMARY KEY REFERENCES municipios(id_municipio),
  key_cifrada   BYTEA NOT NULL,
  proveedor     VARCHAR(20) NOT NULL,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotada_en     TIMESTAMPTZ
);
