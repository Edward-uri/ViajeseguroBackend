import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

/** El pasajero comparte su ubicación; se reenvía al conductor asignado mientras el viaje está activo. */
export function registrarUbicacionPasajero(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idPasajero: number, lat: number, lng: number): Promise<void> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const viaje = await deps.viajes.porId(idViaje);
    // Los warn diagnostican por qué una ubicación no llega a la otra app (drops silenciosos).
    if (!viaje) return console.warn(`[ubicacion] viaje ${idViaje} no existe (pasajero ${idPasajero})`);
    if (viaje.idPasajero !== idPasajero) return console.warn(`[ubicacion] viaje ${idViaje}: pasajero ${idPasajero} no es el del viaje (${viaje.idPasajero})`);
    if (viaje.idConductor == null) return console.warn(`[ubicacion] viaje ${idViaje} sin conductor asignado, se ignora ubicacion del pasajero`);
    if (viaje.estado !== 'aceptado' && viaje.estado !== 'en_curso') return console.warn(`[ubicacion] viaje ${idViaje} en estado ${viaje.estado}, se ignora ubicacion del pasajero`);
    await deps.notifier.ubicacionPasajero({ idViaje, idConductor: viaje.idConductor, lat, lng });
  };
}
