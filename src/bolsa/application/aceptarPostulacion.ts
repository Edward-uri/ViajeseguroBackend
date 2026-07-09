import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';
import type { Postulacion } from '../domain/Postulacion.js';
import type { Vacante } from '../domain/Vacante.js';

export function aceptarPostulacion(deps: {
  bolsa: Pick<IBolsaRepository, 'aceptarPostulacion'>;
  conductores: Pick<IConductorRepository, 'getVehiculoActivo' | 'setVehiculoActivo'>;
  push: IPushSender;
}) {
  return async (input: { idPostulacion: number; idPropietario: number }): Promise<{
    postulacion: Postulacion; vacante: Vacante; rechazadosIdsConductor: number[];
  }> => {
    // Transacción única: lock+valida+asigna(origen='bolsa')+acepta+rechaza-resto+cierra vacante.
    // Puede lanzar PostulacionNoPendienteError (409) / VacanteCerradaError (409) / NoEsTuVacanteError (403);
    // en esos casos nada de lo de abajo corre (la tx ya hizo rollback en el repo).
    const result = await deps.bolsa.aceptarPostulacion(input);
    const { postulacion, vacante } = result;

    // Fuera de la tx, no-fatal: si el conductor no tiene vehículo activo, este pasa a serlo.
    try {
      if ((await deps.conductores.getVehiculoActivo(postulacion.idConductor)) === null) {
        await deps.conductores.setVehiculoActivo(postulacion.idConductor, vacante.idVehiculo);
      }
    } catch (err) {
      console.error('[aceptarPostulacion] no se pudo fijar el vehículo activo:', err);
    }

    // Notificaciones best-effort (no-fatal): la aceptación ya quedó persistida pase lo que pase aquí.
    await notificar(deps.push, postulacion.idConductor, 'aceptada');
    for (const idConductor of result.rechazadosIdsConductor) {
      await notificar(deps.push, idConductor, 'rechazada');
    }

    return result;
  };
}

async function notificar(push: IPushSender, idConductor: number, resultado: 'aceptada' | 'rechazada'): Promise<void> {
  try {
    if (resultado === 'aceptada') {
      await push.enviar({
        idUsuario: idConductor,
        titulo: 'Tu postulación fue aceptada',
        cuerpo: 'Ya puedes manejar este vehículo.',
        data: { tipo: 'postulacion_aceptada' },
      });
    } else {
      await push.enviar({
        idUsuario: idConductor,
        titulo: 'Vacante cubierta',
        cuerpo: 'La vacante fue cubierta por otro conductor.',
        data: { tipo: 'postulacion_rechazada' },
      });
    }
  } catch (err) {
    // Best-effort: el push nunca debe revertir ni interrumpir una aceptación ya persistida.
    console.error('[aceptarPostulacion] push falló:', err);
  }
}
