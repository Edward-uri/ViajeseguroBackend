import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

export function registrarUbicacion(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idConductor: number, lat: number, lng: number): Promise<void> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) return;
    if (viaje.idConductor !== idConductor) return;
    if (viaje.estado !== 'aceptado' && viaje.estado !== 'en_curso') return;
    await deps.viajes.guardarUbicacion(idViaje, lat, lng);
    await deps.notifier.ubicacionConductor({ idViaje, idPasajero: viaje.idPasajero, lat, lng });
  };
}
