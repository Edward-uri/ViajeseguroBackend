import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

export function registrarUbicacion(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idConductor: number, lat: number, lng: number): Promise<void> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const viaje = await deps.viajes.porId(idViaje);
    // Los warn diagnostican por qué una ubicación no llega a la otra app (drops silenciosos).
    if (!viaje) return console.warn(`[ubicacion] viaje ${idViaje} no existe (conductor ${idConductor})`);
    if (viaje.idConductor !== idConductor) return console.warn(`[ubicacion] viaje ${idViaje}: conductor ${idConductor} no es el asignado (${viaje.idConductor})`);
    if (viaje.estado !== 'aceptado' && viaje.estado !== 'en_curso') return console.warn(`[ubicacion] viaje ${idViaje} en estado ${viaje.estado}, se ignora ubicacion del conductor`);
    await deps.viajes.guardarUbicacion(idViaje, lat, lng);
    await deps.notifier.ubicacionConductor({ idViaje, idPasajero: viaje.idPasajero, lat, lng });
  };
}
