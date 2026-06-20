import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function aceptarViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier; push: IPushSender }) {
  return async (idViaje: number, idConductor: number, idVehiculo: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (!puedeTransicionar(viaje.estado, 'aceptado')) throw new TransicionInvalidaError(viaje.estado, 'aceptado');
    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'aceptado', idConductor, idVehiculo });
    await deps.notifier.viajeAceptado(actualizado.toJSON());
    await deps.push.enviar({ idUsuario: viaje.idPasajero, titulo: 'Tu conductor va en camino', cuerpo: 'Un conductor aceptó tu viaje.' });
    return actualizado.toJSON();
  };
}
