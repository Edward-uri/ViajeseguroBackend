import { PropietarioPostgresRepository } from './PropietarioPostgresRepository.js';
import { VehiculoPostgresRepository } from './VehiculoPostgresRepository.js';
import { DocumentoVehiculoPostgresRepository } from './DocumentoVehiculoPostgresRepository.js';
import { AsignacionPostgresRepository } from './AsignacionPostgresRepository.js';
import { LocalDocumentStorage } from '../../infrastructure/storage/LocalDocumentStorage.js';
import { municipioRepository } from '../../municipios/infrastructure/dependencies.js';
import { getPerfil } from '../application/getPerfil.js';
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

const propietarios = new PropietarioPostgresRepository();
export const vehiculos = new VehiculoPostgresRepository();
const documentos = new DocumentoVehiculoPostgresRepository();
const storage = new LocalDocumentStorage();
export const asignaciones = new AsignacionPostgresRepository();

export const flotillaUseCases = {
  getPerfil: getPerfil({ propietarios }),
  upsertPerfil: upsertPerfil({ propietarios }),
  registrarVehiculo: registrarVehiculo({ propietarios, vehiculos, municipios: municipioRepository }),
  listarVehiculos: listarVehiculos({ vehiculos, documentos, asignaciones }),
  getVehiculo: getVehiculo({ vehiculos, documentos }),
  editarVehiculo: editarVehiculo({ vehiculos, municipios: municipioRepository }),
  uploadDocumentoVehiculo: uploadDocumentoVehiculo({ vehiculos, documentos, storage }),
  reviewDocumentoVehiculo: reviewDocumentoVehiculo({ vehiculos, documentos }),
  listVehiculosPendientes: listVehiculosPendientes({ vehiculos }),
  getArchivoVehiculo: getArchivoVehiculo({ vehiculos, documentos, storage }),
  asignarConductor: asignarConductor({ vehiculos, asignaciones }),
  revocarConductor: revocarConductor({ vehiculos, asignaciones }),
  listarConductoresAsignados: listarConductoresAsignados({ vehiculos, asignaciones }),
};
