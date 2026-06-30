// Solo documentos PERSONALES del conductor. Los del vehículo (tarjeta_circulacion,
// foto_vehiculo) viven en el dominio flotillas, ligados a un vehiculo real.
export type TipoDocumento = 'licencia' | 'ine_frente' | 'ine_reverso';

export type EstadoDocumento = 'pendiente' | 'aprobado' | 'rechazado';
export type EstadoVerificacion = 'incompleto' | 'en_revision' | 'rechazado' | 'aprobado';

export const REQUERIDOS: TipoDocumento[] = ['licencia', 'ine_frente', 'ine_reverso'];

/** Combina dos estados de verificación (p.ej. docs del conductor + estado del vehículo)
 *  tomando siempre el más bloqueante. Sin vehículo registrado se pasa 'incompleto'. */
export function combinarEstado(a: EstadoVerificacion, b: EstadoVerificacion): EstadoVerificacion {
  const orden: EstadoVerificacion[] = ['incompleto', 'rechazado', 'en_revision', 'aprobado'];
  return orden[Math.min(orden.indexOf(a), orden.indexOf(b))]!;
}

export function calcularEstadoVerificacion(
  estadosPorTipo: Map<TipoDocumento, EstadoDocumento>,
): EstadoVerificacion {
  if (REQUERIDOS.some((t) => !estadosPorTipo.has(t))) return 'incompleto';
  const estados = REQUERIDOS.map((t) => estadosPorTipo.get(t)!);
  if (estados.some((e) => e === 'rechazado')) return 'rechazado';
  if (estados.some((e) => e === 'pendiente')) return 'en_revision';
  return 'aprobado';
}
