import { PropietarioPostgresRepository } from './PropietarioPostgresRepository.js';
import { VehiculoPostgresRepository } from './VehiculoPostgresRepository.js';
import { DocumentoVehiculoPostgresRepository } from './DocumentoVehiculoPostgresRepository.js';
import { AsignacionPostgresRepository } from './AsignacionPostgresRepository.js';
import { ConductorPostgresRepository } from '../../conductores/infrastructure/ConductorPostgresRepository.js';
import { ViajePostgresRepository } from '../../viajes/infrastructure/ViajePostgresRepository.js';
import { UserPostgresRepository } from '../../users/infrastructure/UserPostgresRepository.js';
import { LocalDocumentStorage } from '../../infrastructure/storage/LocalDocumentStorage.js';
import { municipioRepository } from '../../municipios/infrastructure/dependencies.js';
import { getPerfil } from '../application/getPerfil.js';
import { activarPropietario } from '../application/activarPropietario.js';
import { upsertPerfil } from '../application/upsertPerfil.js';
import { registrarVehiculo } from '../application/registrarVehiculo.js';
import { listarVehiculos } from '../application/listarVehiculos.js';
import { getVehiculo } from '../application/getVehiculo.js';
import { editarVehiculo } from '../application/editarVehiculo.js';
import { uploadDocumentoVehiculo } from '../application/uploadDocumentoVehiculo.js';
import { reviewDocumentoVehiculo } from '../application/reviewDocumentoVehiculo.js';
import { listVehiculosPendientes } from '../application/listVehiculosPendientes.js';
import { getArchivoVehiculo } from '../application/getArchivoVehiculo.js';
import { asignarConductor } from '../application/asignarConductor.js';
import { revocarConductor } from '../application/revocarConductor.js';
import { listarConductoresAsignados } from '../application/listarConductoresAsignados.js';
import { editarTerminosConductor } from '../application/editarTerminosConductor.js';
import { pickPushSender } from '../../viajes/infrastructure/pushSenderFactory.js';
import { DispositivoPostgresRepository } from '../../viajes/infrastructure/DispositivoPostgresRepository.js';
import { env } from '../../core/env.js';
import { estadoVehiculo } from '../application/estadoVehiculo.js';
import { setVehiculoActivoUseCase } from '../application/setVehiculoActivoUseCase.js';

export const propietarios = new PropietarioPostgresRepository();
export const vehiculos = new VehiculoPostgresRepository();
const documentos = new DocumentoVehiculoPostgresRepository();
const storage = new LocalDocumentStorage();
export const asignaciones = new AsignacionPostgresRepository();
const conductores = new ConductorPostgresRepository();
const viajes = new ViajePostgresRepository();
const users = new UserPostgresRepository();
const push = pickPushSender(env.FCM_SERVICE_ACCOUNT, new DispositivoPostgresRepository());

export const flotillaUseCases = {
  getPerfil: getPerfil({ propietarios }),
  activarPropietario: activarPropietario({ users, propietarios }),
  upsertPerfil: upsertPerfil({ propietarios }),
  registrarVehiculo: registrarVehiculo({ propietarios, vehiculos, municipios: municipioRepository, conductores }),
  listarVehiculos: listarVehiculos({ vehiculos, documentos, asignaciones, conductores }),
  getVehiculo: getVehiculo({ vehiculos, documentos }),
  editarVehiculo: editarVehiculo({ vehiculos, municipios: municipioRepository }),
  uploadDocumentoVehiculo: uploadDocumentoVehiculo({ vehiculos, documentos, storage }),
  reviewDocumentoVehiculo: reviewDocumentoVehiculo({ vehiculos, documentos, push }),
  listVehiculosPendientes: listVehiculosPendientes({ vehiculos }),
  getArchivoVehiculo: getArchivoVehiculo({ vehiculos, documentos, storage }),
  asignarConductor: asignarConductor({ vehiculos, asignaciones }),
  revocarConductor: revocarConductor({ vehiculos, asignaciones, viajes, conductores, push }),
  listarConductoresAsignados: listarConductoresAsignados({ vehiculos, asignaciones }),
  editarTerminosConductor: editarTerminosConductor({ vehiculos, asignaciones }),
  estadoVehiculo: estadoVehiculo({ documentos }),
  setVehiculoActivo: setVehiculoActivoUseCase({ asignaciones, conductores }),
};
