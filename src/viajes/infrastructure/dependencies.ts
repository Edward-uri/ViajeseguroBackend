import { ConductorPostgresRepository } from '../../conductores/infrastructure/ConductorPostgresRepository.js';
import { ViajePostgresRepository } from './ViajePostgresRepository.js';
import { ZonaTarifaPostgresRepository } from './ZonaTarifaPostgresRepository.js';
import { DispositivoPostgresRepository } from './DispositivoPostgresRepository.js';
import { HaversineRouteEstimator } from './HaversineRouteEstimator.js';
import { OsrmRouteEstimator } from './OsrmRouteEstimator.js';
import { TarifaPorZona } from './TarifaPorZona.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';
import { SocketEventoViajeNotifier } from './SocketEventoViajeNotifier.js';
import { pickPushSender } from './pushSenderFactory.js';
import { env } from '../../core/env.js';
import { municipioRepository } from '../../municipios/infrastructure/dependencies.js';
import { getTarifario } from '../application/getTarifario.js';
import { crearViaje } from '../application/crearViaje.js';
import { getViaje } from '../application/getViaje.js';
import { listarMisViajes } from '../application/listarMisViajes.js';
import { destinosRecientes } from '../application/destinosRecientes.js';
import { getViajeActivo } from '../application/getViajeActivo.js';
import { cancelarViaje } from '../application/cancelarViaje.js';
import { conductorCancelaViaje } from '../application/conductorCancelaViaje.js';
import { expirarViajes } from '../application/expirarViajes.js';
import { aceptarViaje } from '../application/aceptarViaje.js';
import { reportes } from '../../reportes/infrastructure/dependencies.js';
import { iniciarViaje } from '../application/iniciarViaje.js';
import { completarViaje } from '../application/completarViaje.js';
import { evaluarViaje } from '../application/evaluarViaje.js';
import { registrarDispositivo } from '../application/registrarDispositivo.js';
import { registrarUbicacion } from '../application/registrarUbicacion.js';
import { registrarUbicacionPasajero } from '../application/registrarUbicacionPasajero.js';
import { conductorUseCases } from '../../conductores/infrastructure/dependencies.js';
import { listarViajesPendientes } from '../application/listarViajesPendientes.js';
import { listarViajesAsignados } from '../application/listarViajesAsignados.js';
import { rechazarViaje } from '../application/rechazarViaje.js';
import { estimarViaje } from '../application/estimarViaje.js';
import { validarViajeEnMunicipio } from '../application/validarViajeEnMunicipio.js';
import { asignaciones, vehiculos as flotillaVehiculos, flotillaUseCases } from '../../flotillas/infrastructure/dependencies.js';
import { ZonaAdminPostgresRepository } from './ZonaAdminPostgresRepository.js';
import { EtiquetaPostgresRepository } from './EtiquetaPostgresRepository.js';
import { SenalesMlPostgresRepository } from './SenalesMlPostgresRepository.js';
import { tomarSnapshotDisponibilidad } from '../application/tomarSnapshotDisponibilidad.js';
import { registrarEventoDemanda } from '../application/registrarEventoDemanda.js';
import { LlmJalaClient } from './LlmJalaClient.js';
import { procesarEvaluacionesNlp } from '../application/procesarEvaluacionesNlp.js';
import { listarEtiquetasDeUsuario } from '../application/listarEtiquetasDeUsuario.js';
import { listarZonasAdmin } from '../application/listarZonasAdmin.js';
import { crearZona } from '../application/crearZona.js';
import { actualizarZona } from '../application/actualizarZona.js';
import { desactivarZona } from '../application/desactivarZona.js';

const viajes = new ViajePostgresRepository();
const conductores = new ConductorPostgresRepository();
const zonas = new ZonaTarifaPostgresRepository();
const zonasAdmin = new ZonaAdminPostgresRepository();
const dispositivos = new DispositivoPostgresRepository();
const haversine = new HaversineRouteEstimator();
// Con OSRM_URL seteada se usa ruteo real (con Haversine de fallback); sin ella, solo Haversine.
const rutas: IRouteEstimator = env.OSRM_URL ? new OsrmRouteEstimator(env.OSRM_URL, haversine) : haversine;
const tarifas = new TarifaPorZona(zonas);
const validarPerimetro = validarViajeEnMunicipio({ zonas, municipios: municipioRepository, radioKm: env.RADIO_MUNICIPIO_KM });
const etiquetas = new EtiquetaPostgresRepository();
const senales = new SenalesMlPostgresRepository();
// Sin LLM_JALA_URL el job no se agenda (ver index.ts); el placeholder nunca se usa.
const clasificador = new LlmJalaClient(env.LLM_JALA_URL ?? 'http://llm-jala-no-configurado', env.LLM_JALA_API_KEY);

export const socketNotifier = new SocketEventoViajeNotifier();
const notifier = socketNotifier;
const push = pickPushSender(env.FCM_SERVICE_ACCOUNT, dispositivos);

const autorizacionVehiculo = {
  existeVehiculo: async (idVehiculo: number) => (await flotillaVehiculos.findById(idVehiculo)) != null,
  conductorAutorizado: (idConductor: number, idVehiculo: number) =>
    asignaciones.conductorAutorizado(idConductor, idVehiculo),
  vehiculoAprobado: async (idVehiculo: number) =>
    (await flotillaUseCases.estadoVehiculo({ idVehiculo })) === 'aprobado',
};

export const viajeUseCases = {
  getTarifario: getTarifario({ zonas }),
  rutaEntre: (o: { lat: number; lng: number }, d: { lat: number; lng: number }) => rutas.estimar(o, d),
  crearViaje: crearViaje({ viajes, tarifas, municipios: municipioRepository, notifier, rutas, validarPerimetro, bloqueos: reportes }),
  estimarViaje: estimarViaje({ tarifas, municipios: municipioRepository, rutas, validarPerimetro }),
  getViaje: getViaje({ viajes }),
  listarMisViajes: listarMisViajes({ viajes }),
  destinosRecientes: destinosRecientes({ viajes }),
  getViajeActivo: getViajeActivo({ viajes }),
  cancelarViaje: cancelarViaje({ viajes, notifier }),
  conductorCancelaViaje: conductorCancelaViaje({ viajes, notifier }),
  expirarViajes: expirarViajes({ viajes, notifier }),
  aceptarViaje: aceptarViaje({ viajes, notifier, push, autorizacion: autorizacionVehiculo, conductores, municipioDelConductor: conductorUseCases.municipioOperativo, bloqueos: reportes }),
  iniciarViaje: iniciarViaje({ viajes, notifier }),
  completarViaje: completarViaje({ viajes, notifier }),
  evaluarViaje: evaluarViaje({ viajes }),
  procesarEvaluacionesNlp: procesarEvaluacionesNlp({ etiquetas, clasificador }),
  tomarSnapshotDisponibilidad: tomarSnapshotDisponibilidad({ senales }),
  registrarEventoDemanda: registrarEventoDemanda({ senales }),
  listarEtiquetasDeUsuario: listarEtiquetasDeUsuario({ etiquetas }),
  registrarDispositivo: registrarDispositivo({ dispositivos }),
  registrarUbicacion: registrarUbicacion({ viajes, notifier }),
  registrarUbicacionPasajero: registrarUbicacionPasajero({ viajes, notifier }),
  listarViajesPendientes: listarViajesPendientes({ viajes, municipioDelConductor: conductorUseCases.municipioOperativo }),
  listarViajesAsignados: listarViajesAsignados({ viajes }),
  rechazarViaje: rechazarViaje({ viajes }),
  listarZonasAdmin: listarZonasAdmin({ zonasAdmin }),
  crearZona: crearZona({ zonasAdmin }),
  actualizarZona: actualizarZona({ zonasAdmin }),
  desactivarZona: desactivarZona({ zonasAdmin }),
};