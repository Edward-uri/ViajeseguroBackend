export type TipoDocumento =
  | 'licencia'
  | 'ine_frente'
  | 'ine_reverso'
  | 'tarjeta_circulacion'
  | 'foto_vehiculo';

export type EstadoDocumento = 'pendiente' | 'aprobado' | 'rechazado';
export type EstadoVerificacion = 'incompleto' | 'en_revision' | 'rechazado' | 'aprobado';

export const REQUERIDOS: TipoDocumento[] = [
  'licencia',
  'ine_frente',
  'ine_reverso',
  'tarjeta_circulacion',
  'foto_vehiculo',
];

export function calcularEstadoVerificacion(
  estadosPorTipo: Map<TipoDocumento, EstadoDocumento>,
): EstadoVerificacion {
  if (REQUERIDOS.some((t) => !estadosPorTipo.has(t))) return 'incompleto';
  const estados = REQUERIDOS.map((t) => estadosPorTipo.get(t)!);
  if (estados.some((e) => e === 'rechazado')) return 'rechazado';
  if (estados.some((e) => e === 'pendiente')) return 'en_revision';
  return 'aprobado';
}
