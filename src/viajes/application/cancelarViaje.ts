import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function cancelarViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier }) {
  return async (idViaje: number, idPasajero: number, motivo?: string | null): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idPasajero !== idPasajero) throw new NoEsTuViajeError();
    if (!puedeTransicionar(viaje.estado, 'cancelado')) throw new TransicionInvalidaError(viaje.estado, 'cancelado');
    const estabaSolicitado = viaje.estado === 'solicitado';
    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'cancelado', esperado: viaje.estado, canceladoPor: 'pasajero', motivo: motivo ?? null });
    await deps.notifier.cambioEstado(actualizado.toJSON());
    // Si aún estaba pendiente, quítalo de la lista de los conductores del municipio.
    if (estabaSolicitado) await deps.notifier.viajeYaNoDisponible(viaje.data.idMunicipio, idViaje);
    return actualizado.toJSON();
  };
}
