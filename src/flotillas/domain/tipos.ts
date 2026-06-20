export type TipoDocumentoVehiculo = 'tarjeta_circulacion' | 'foto_vehiculo' | 'permiso_municipal';

export type EstadoDocumento = 'pendiente' | 'aprobado' | 'rechazado';
export type EstadoVerificacion = 'incompleto' | 'en_revision' | 'rechazado' | 'aprobado';

export const REQUERIDOS_VEHICULO: TipoDocumentoVehiculo[] = ['tarjeta_circulacion', 'foto_vehiculo'];
export const OPCIONALES_VEHICULO: TipoDocumentoVehiculo[] = ['permiso_municipal'];
export const TIPOS_VEHICULO: TipoDocumentoVehiculo[] = [...REQUERIDOS_VEHICULO, ...OPCIONALES_VEHICULO];

/** Solo los requeridos cuentan; los opcionales no bloquean. */
export function calcularEstadoVerificacion(
  estadosPorTipo: Map<TipoDocumentoVehiculo, EstadoDocumento>,
): EstadoVerificacion {
  if (REQUERIDOS_VEHICULO.some((t) => !estadosPorTipo.has(t))) return 'incompleto';
  const estados = REQUERIDOS_VEHICULO.map((t) => estadosPorTipo.get(t)!);
  if (estados.some((e) => e === 'rechazado')) return 'rechazado';
  if (estados.some((e) => e === 'pendiente')) return 'en_revision';
  return 'aprobado';
}
