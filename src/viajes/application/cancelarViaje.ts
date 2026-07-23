import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, TransicionInvalidaError } from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function cancelarViaje(deps: { viajes: IViajeRepository; notifier: IEventoViajeNotifier; push: IPushSender }) {
  return async (idViaje: number, idPasajero: number, motivo?: string | null): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idPasajero !== idPasajero) throw new NoEsTuViajeError();
    if (!puedeTransicionar(viaje.estado, 'cancelado')) throw new TransicionInvalidaError(viaje.estado, 'cancelado');
    const estabaSolicitado = viaje.estado === 'solicitado';
    const idConductor = viaje.idConductor; // snapshot antes de cancelar
    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'cancelado', esperado: viaje.estado, canceladoPor: 'pasajero', motivo: motivo ?? null });
    await deps.notifier.cambioEstado(actualizado.toJSON());
    if (estabaSolicitado) {
      // Aún pendiente: quítalo de la lista de los conductores del municipio.
      await deps.notifier.viajeYaNoDisponible(viaje.data.idMunicipio, idViaje);
    } else if (idConductor != null) {
      // Ya estaba asignado: avisa al conductor (best-effort, no revierte la cancelación).
      try {
        await deps.push.enviar({
          idUsuario: idConductor,
          titulo: 'Viaje cancelado',
          cuerpo: 'El pasajero canceló el viaje.',
          data: { tipo: 'viaje_cancelado', idViaje: String(idViaje) },
        });
      } catch {
        // Best-effort.
      }
    }
    return actualizado.toJSON();
  };
}
