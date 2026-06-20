import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function completarViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idConductor: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idConductor !== idConductor) throw new NoEsTuViajeError();
    if (!puedeTransicionar(viaje.estado, 'completado')) throw new TransicionInvalidaError(viaje.estado, 'completado');
    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'completado' });
    await deps.notifier.cambioEstado(actualizado.toJSON());
    return actualizado.toJSON();
  };
}
