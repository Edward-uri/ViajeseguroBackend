import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';
import type { IBloqueoChecker } from '../domain/ports/IBloqueoChecker.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { MunicipioInvalidoError, PasajeroConViajeActivoError, TarifaCambiadaError } from '../domain/errors.js';

export interface CrearViajeDTO {
  idPasajero: number;
  idMunicipio: number;
  origen: { lat: number; lng: number; texto?: string | null };
  destino: { lat: number; lng: number; texto?: string | null };
  idZonaDestino?: number;
  personas: number;
  tarifaEstimada?: number;
}

export function crearViaje(deps: {
  viajes: IViajeRepository;
  tarifas: ITarifaCalculator;
  municipios: IMunicipioRepository;
  notifier: IEventoViajeNotifier;
  rutas: IRouteEstimator;
  validarPerimetro: (idMunicipio: number, origen: { lat: number; lng: number }, destino: { lat: number; lng: number }) => Promise<void>;
  bloqueos: Pick<IBloqueoChecker, 'usuariosBloqueadosCon'>;
}) {
  return async (input: CrearViajeDTO): Promise<PublicViaje> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) throw new MunicipioInvalidoError();
    if (await deps.viajes.pasajeroConViajeActivo(input.idPasajero)) throw new PasajeroConViajeActivoError();

    const origen = { lat: input.origen.lat, lng: input.origen.lng };
    const destino = { lat: input.destino.lat, lng: input.destino.lng };
    await deps.validarPerimetro(input.idMunicipio, origen, destino);

    const { distanciaKm } = await deps.rutas.estimar(origen, destino);
    const t = await deps.tarifas.calcular({
      idMunicipio: input.idMunicipio,
      personas: input.personas,
      idZonaDestino: input.idZonaDestino,
      origen,
      destino,
    });

    // Si el cliente mostró una tarifa y la vigente cambió, no cobrar distinto a lo visto.
    if (input.tarifaEstimada != null && input.tarifaEstimada !== t.tarifa) throw new TarifaCambiadaError();

    const viaje = await deps.viajes.crear({
      idPasajero: input.idPasajero,
      idMunicipio: input.idMunicipio,
      origen: input.origen,
      destino: input.destino,
      idZonaDestino: t.idZonaDestino,
      distanciaKm,
      numPasajeros: input.personas,
      tarifa: t.tarifa,
      tarifaEstimada: t.estimada,
    });
    // Bloqueo (capa 1): no difundir a conductores bloqueados con el pasajero.
    const conductoresBloqueados = await deps.bloqueos.usuariosBloqueadosCon(input.idPasajero);
    await deps.notifier.viajeSolicitado(viaje.toJSON(), conductoresBloqueados);
    return viaje.toJSON();
  };
}
