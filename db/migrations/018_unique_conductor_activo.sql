BEGIN;

-- Un conductor solo puede tener un viaje activo (aceptado o en_curso) a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_viaje_conductor_activo
  ON viajes (id_conductor)
  WHERE estado IN ('aceptado','en_curso') AND id_conductor IS NOT NULL;

COMMIT;
