import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function conductorCancelaViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idConductor: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idConductor !== idConductor) throw new NoEsTuViajeError();
    // Solo desde 'aceptado' (no en_curso): se devuelve al pool, no se cancela.
    if (viaje.estado !== 'aceptado' || !puedeTransicionar(viaje.estado, 'cancelado'))
      throw new TransicionInvalidaError(viaje.estado, 'solicitado');

    const actualizado = await deps.viajes.cambiarEstado({
      idViaje, nuevo: 'solicitado', esperado: 'aceptado', idConductor: null, idVehiculo: null,
    });
    // No volver a ofrecérselo a quien lo soltó.
    await deps.viajes.rechazar(idViaje, idConductor);
    // Avisar al pasajero que su viaje volvió a "buscando conductor".
    await deps.notifier.cambioEstado(actualizado.toJSON());
    // Reponerlo en la lista de los conductores del municipio.
    await deps.notifier.viajeSolicitado(actualizado.toJSON());
    return actualizado.toJSON();
  };
}
