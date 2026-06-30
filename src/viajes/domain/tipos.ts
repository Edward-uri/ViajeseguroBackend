export interface RutaGeoJSON {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] (orden GeoJSON/OSRM)
}

export type EstadoViaje = 'solicitado' | 'aceptado' | 'en_curso' | 'completado' | 'cancelado';
export type TipoServicio = 'viaje' | 'envio';
export type CanceladoPor = 'pasajero' | 'conductor' | 'sistema';

export interface Coordenada { lat: number; lng: number; }

export const TRANSICIONES: Record<EstadoViaje, EstadoViaje[]> = {
  solicitado: ['aceptado', 'cancelado'],
  aceptado: ['en_curso', 'cancelado'],
  en_curso: ['completado'],
  completado: [],
  cancelado: [],
};

export function puedeTransicionar(de: EstadoViaje, a: EstadoViaje): boolean {
  return TRANSICIONES[de].includes(a);
}

/** Cupo de un mototaxi: se cobra el mismo precio fijo por cada pasajero. */
export const MAX_PASAJEROS = 3;

/** Una solicitud sin conductor expira tras estos minutos y se cancela por el sistema. */
export const MINUTOS_EXPIRACION_SOLICITUD = 5;
