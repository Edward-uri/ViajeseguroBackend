import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

/** El pasajero comparte su ubicación; se reenvía al conductor asignado mientras el viaje está activo. */
export function registrarUbicacionPasajero(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idPasajero: number, lat: number, lng: number): Promise<void> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) return;
    if (viaje.idPasajero !== idPasajero) return;
    if (viaje.idConductor == null) return;
    if (viaje.estado !== 'aceptado' && viaje.estado !== 'en_curso') return;
    await deps.notifier.ubicacionPasajero({ idViaje, idConductor: viaje.idConductor, lat, lng });
  };
}
