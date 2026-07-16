-- ===== hijas de viajes =====
ALTER TABLE rastreo_ubicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE rastreo_ubicacion FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rastreo_ubicacion_tenant ON rastreo_ubicacion;
CREATE POLICY rastreo_ubicacion_tenant ON rastreo_ubicacion
  USING (EXISTS (SELECT 1 FROM viajes v WHERE v.id_viaje = rastreo_ubicacion.id_viaje));

ALTER TABLE viaje_estado_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaje_estado_historial FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS viaje_estado_historial_tenant ON viaje_estado_historial;
CREATE POLICY viaje_estado_historial_tenant ON viaje_estado_historial
  USING (EXISTS (SELECT 1 FROM viajes v WHERE v.id_viaje = viaje_estado_historial.id_viaje));

ALTER TABLE viaje_rechazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaje_rechazos FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS viaje_rechazos_tenant ON viaje_rechazos;
CREATE POLICY viaje_rechazos_tenant ON viaje_rechazos
  USING (EXISTS (SELECT 1 FROM viajes v WHERE v.id_viaje = viaje_rechazos.id_viaje));

ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evaluaciones_tenant ON evaluaciones;
CREATE POLICY evaluaciones_tenant ON evaluaciones
  USING (EXISTS (SELECT 1 FROM viajes v WHERE v.id_viaje = evaluaciones.id_viaje));

-- ===== hijas de conductores =====
ALTER TABLE documentos_conductor ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_conductor FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documentos_conductor_tenant ON documentos_conductor;
CREATE POLICY documentos_conductor_tenant ON documentos_conductor
  USING (EXISTS (SELECT 1 FROM conductores c WHERE c.id_conductor = documentos_conductor.id_conductor));

ALTER TABLE conductor_disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor_disponibilidad FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conductor_disponibilidad_tenant ON conductor_disponibilidad;
CREATE POLICY conductor_disponibilidad_tenant ON conductor_disponibilidad
  USING (EXISTS (SELECT 1 FROM conductores c WHERE c.id_conductor = conductor_disponibilidad.id_conductor));

ALTER TABLE conductor_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor_sesiones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conductor_sesiones_tenant ON conductor_sesiones;
CREATE POLICY conductor_sesiones_tenant ON conductor_sesiones
  USING (EXISTS (SELECT 1 FROM conductores c WHERE c.id_conductor = conductor_sesiones.id_conductor));

ALTER TABLE conductor_cambio_estatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor_cambio_estatus FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conductor_cambio_estatus_tenant ON conductor_cambio_estatus;
CREATE POLICY conductor_cambio_estatus_tenant ON conductor_cambio_estatus
  USING (EXISTS (SELECT 1 FROM conductores c WHERE c.id_conductor = conductor_cambio_estatus.id_conductor));

-- ===== hijas de vehiculos =====
ALTER TABLE documentos_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_vehiculo FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documentos_vehiculo_tenant ON documentos_vehiculo;
CREATE POLICY documentos_vehiculo_tenant ON documentos_vehiculo
  USING (EXISTS (SELECT 1 FROM vehiculos ve WHERE ve.id_vehiculo = documentos_vehiculo.id_vehiculo));

ALTER TABLE asignaciones_conductor_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_conductor_vehiculo FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS asignaciones_tenant ON asignaciones_conductor_vehiculo;
CREATE POLICY asignaciones_tenant ON asignaciones_conductor_vehiculo
  USING (EXISTS (SELECT 1 FROM vehiculos ve WHERE ve.id_vehiculo = asignaciones_conductor_vehiculo.id_vehiculo));

ALTER TABLE vehiculo_cambio_estatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo_cambio_estatus FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehiculo_cambio_estatus_tenant ON vehiculo_cambio_estatus;
CREATE POLICY vehiculo_cambio_estatus_tenant ON vehiculo_cambio_estatus
  USING (EXISTS (SELECT 1 FROM vehiculos ve WHERE ve.id_vehiculo = vehiculo_cambio_estatus.id_vehiculo));

-- ===== hijas de vacantes =====
ALTER TABLE postulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE postulaciones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS postulaciones_tenant ON postulaciones;
CREATE POLICY postulaciones_tenant ON postulaciones
  USING (EXISTS (SELECT 1 FROM vacantes va WHERE va.id_vacante = postulaciones.id_vacante));
