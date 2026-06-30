import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

export function expirarViajes(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (): Promise<number> => {
    const vencidos = await deps.viajes.expirarVencidos();
    for (const v of vencidos) {
      await deps.notifier.cambioEstadoPasajero(v.idPasajero, v.idViaje, 'cancelado');
      await deps.notifier.viajeYaNoDisponible(v.idMunicipio, v.idViaje);
    }
    return vencidos.length;
  };
}
