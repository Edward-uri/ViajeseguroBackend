import { ViajePostgresRepository } from './ViajePostgresRepository.js';
import { ZonaTarifaPostgresRepository } from './ZonaTarifaPostgresRepository.js';
import { DispositivoPostgresRepository } from './DispositivoPostgresRepository.js';
import { HaversineRouteEstimator } from './HaversineRouteEstimator.js';
import { TarifaPorZona } from './TarifaPorZona.js';
import { MockEventoViajeNotifier } from './MockEventoViajeNotifier.js';
import { MockPushSender } from './MockPushSender.js';
import { municipioRepository } from '../../municipios/infrastructure/dependencies.js';
import { getTarifario } from '../application/getTarifario.js';
import { crearViaje } from '../application/crearViaje.js';
import { getViaje } from '../application/getViaje.js';
import { listarMisViajes } from '../application/listarMisViajes.js';
import { cancelarViaje } from '../application/cancelarViaje.js';
import { aceptarViaje } from '../application/aceptarViaje.js';
import { iniciarViaje } from '../application/iniciarViaje.js';
import { completarViaje } from '../application/completarViaje.js';
import { evaluarViaje } from '../application/evaluarViaje.js';
import { registrarDispositivo } from '../application/registrarDispositivo.js';

const viajes = new ViajePostgresRepository();
const zonas = new ZonaTarifaPostgresRepository();
const dispositivos = new DispositivoPostgresRepository();
const rutas = new HaversineRouteEstimator();
const tarifas = new TarifaPorZona(zonas, rutas);
const notifier = new MockEventoViajeNotifier();
const push = new MockPushSender();

export const viajeUseCases = {
  getTarifario: getTarifario({ zonas }),
  crearViaje: crearViaje({ viajes, tarifas, municipios: municipioRepository, notifier }),
  getViaje: getViaje({ viajes }),
  listarMisViajes: listarMisViajes({ viajes }),
  cancelarViaje: cancelarViaje({ viajes, notifier }),
  aceptarViaje: aceptarViaje({ viajes, notifier, push }),
  iniciarViaje: iniciarViaje({ viajes, notifier }),
  completarViaje: completarViaje({ viajes, notifier }),
  evaluarViaje: evaluarViaje({ viajes }),
  registrarDispositivo: registrarDispositivo({ dispositivos }),
};
