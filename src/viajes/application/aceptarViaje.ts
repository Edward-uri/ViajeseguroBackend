import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { IAutorizacionVehiculo } from '../domain/ports/IConductorAutorizado.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';
import {
  ViajeNoEncontradoError,
  TransicionInvalidaError,
  VehiculoNoEncontradoError,
  VehiculoNoAutorizadoError,
  VehiculoNoAprobadoError,
  ConductorOcupadoError,
  SinVehiculoActivoError,
} from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function aceptarViaje(deps: {
  viajes: IViajeRepository;
  notifier: IEventoViajeNotifier;
  push: IPushSender;
  autorizacion: IAutorizacionVehiculo;
  conductores: Pick<IConductorRepository, 'getVehiculoActivo'>;
  municipioDelConductor: (idConductor: number) => Promise<number | null>;
}) {
  return async (idViaje: number, idConductor: number, idVehiculo?: number): Promise<PublicViaje> => {
    const idVehiculoFinal = idVehiculo ?? (await deps.conductores.getVehiculoActivo(idConductor));
    if (idVehiculoFinal == null) throw new SinVehiculoActivoError();

    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    const municipioConductor = await deps.municipioDelConductor(idConductor);
    if (municipioConductor == null || viaje.data.idMunicipio !== municipioConductor) throw new ViajeNoEncontradoError();
    if (!puedeTransicionar(viaje.estado, 'aceptado')) throw new TransicionInvalidaError(viaje.estado, 'aceptado');

    if (!(await deps.autorizacion.existeVehiculo(idVehiculoFinal))) throw new VehiculoNoEncontradoError();
    if (!(await deps.autorizacion.conductorAutorizado(idConductor, idVehiculoFinal))) throw new VehiculoNoAutorizadoError();
    if (!(await deps.autorizacion.vehiculoAprobado(idVehiculoFinal))) throw new VehiculoNoAprobadoError();
    if (await deps.viajes.conductorConViajeActivo(idConductor)) throw new ConductorOcupadoError();

    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'aceptado', esperado: viaje.estado, idConductor, idVehiculo: idVehiculoFinal });
    await deps.notifier.viajeAceptado(actualizado.toJSON());
    await deps.notifier.viajeYaNoDisponible(viaje.data.idMunicipio, idViaje, idConductor);
    await deps.push.enviar({ idUsuario: viaje.idPasajero, titulo: 'Tu conductor va en camino', cuerpo: 'Un conductor aceptó tu viaje.' });
    return actualizado.toJSON();
  };
}
