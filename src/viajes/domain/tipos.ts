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

/** Fallback de tarifa cuando no hay zona: banderazo + km * precio. */
export const BANDERAZO = 10;
export const PRECIO_KM = 5;
