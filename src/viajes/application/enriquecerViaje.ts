import type { IViajeRepository, ViajePartes } from '../domain/repositories/IViajeRepository.js';
import type { Viaje, PublicViaje } from '../domain/Viaje.js';

export type ViajeDetallado = PublicViaje & ViajePartes;

/** Agrega los datos de la contraparte al viaje. El teléfono solo se incluye en viaje activo. */
export async function enriquecerViaje(viajes: IViajeRepository, viaje: Viaje): Promise<ViajeDetallado> {
  const partes = await viajes.detalleDePartes(viaje.idPasajero, viaje.idConductor, viaje.data.idVehiculo);
  const activo = viaje.estado === 'aceptado' || viaje.estado === 'en_curso';
  if (!activo) {
    if (partes.pasajero) partes.pasajero.telefono = null;
    if (partes.conductor) partes.conductor.telefono = null;
  }
  return { ...viaje.toJSON(), ...partes };
}
