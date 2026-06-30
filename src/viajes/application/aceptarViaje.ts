import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { IAutorizacionVehiculo } from '../domain/ports/IConductorAutorizado.js';
import type { PublicViaje } from '../domain/Viaje.js';
import {
  ViajeNoEncontradoError,
  TransicionInvalidaError,
  VehiculoNoEncontradoError,
  VehiculoNoAutorizadoError,
  VehiculoNoAprobadoError,
  ConductorOcupadoError,
} from '../domain/errors.js';
import { puedeTransicionar } from '../domain/tipos.js';

export function aceptarViaje(deps: {
  viajes: IViajeRepository;
  notifier: IEventoViajeNotifier;
  push: IPushSender;
  autorizacion: IAutorizacionVehiculo;
  municipioDelConductor: (idConductor: number) => Promise<number | null>;
}) {
  return async (idViaje: number, idConductor: number, idVehiculo: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    const municipioConductor = await deps.municipioDelConductor(idConductor);
    if (municipioConductor == null || viaje.data.idMunicipio !== municipioConductor) throw new ViajeNoEncontradoError();
    if (!puedeTransicionar(viaje.estado, 'aceptado')) throw new TransicionInvalidaError(viaje.estado, 'aceptado');

    if (!(await deps.autorizacion.existeVehiculo(idVehiculo))) throw new VehiculoNoEncontradoError();
    if (!(await deps.autorizacion.conductorAutorizado(idConductor, idVehiculo))) throw new VehiculoNoAutorizadoError();
    if (!(await deps.autorizacion.vehiculoAprobado(idVehiculo))) throw new VehiculoNoAprobadoError();
    if (await deps.viajes.conductorConViajeActivo(idConductor)) throw new ConductorOcupadoError();

    const actualizado = await deps.viajes.cambiarEstado({ idViaje, nuevo: 'aceptado', esperado: viaje.estado, idConductor, idVehiculo });
    await deps.notifier.viajeAceptado(actualizado.toJSON());
    await deps.notifier.viajeYaNoDisponible(viaje.data.idMunicipio, idViaje);
    await deps.push.enviar({ idUsuario: viaje.idPasajero, titulo: 'Tu conductor va en camino', cuerpo: 'Un conductor aceptó tu viaje.' });
    return actualizado.toJSON();
  };
}
