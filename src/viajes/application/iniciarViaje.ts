import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function iniciarViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idConductor: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idConductor !== idConductor) throw new NoEsTuViajeError();
    if (!puedeTransicionar(viaje.estado, 'en_curso')) throw new TransicionInvalidaError(viaje.estado, 'en_curso');
    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'en_curso' });
    await deps.notifier.cambioEstado(idViaje, 'en_curso');
    return actualizado.toJSON();
  };
}
