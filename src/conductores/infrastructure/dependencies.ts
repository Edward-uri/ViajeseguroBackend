import { ConductorPostgresRepository } from './ConductorPostgresRepository.js';
import { DocumentoConductorPostgresRepository } from './DocumentoConductorPostgresRepository.js';
import { LocalDocumentStorage } from '../../infrastructure/storage/LocalDocumentStorage.js';
import { municipioRepository } from '../../municipios/infrastructure/dependencies.js';
import { submitLicencia } from '../application/submitLicencia.js';
import { uploadDocumento } from '../application/uploadDocumento.js';
import { getOnboarding } from '../application/getOnboarding.js';
import { reviewDocumento } from '../application/reviewDocumento.js';
import { listConductoresPendientes } from '../application/listConductoresPendientes.js';
import { getArchivo } from '../application/getArchivo.js';
import { municipioOperativo } from '../application/municipioOperativo.js';
import { DisponibilidadPostgresRepository } from './DisponibilidadPostgresRepository.js';
import { SesionPostgresRepository } from './SesionPostgresRepository.js';
import { EstadisticasPostgresRepository } from './EstadisticasPostgresRepository.js';
import { setDisponibilidad } from '../application/setDisponibilidad.js';
import { getDisponibilidad } from '../application/getDisponibilidad.js';
import { getStats } from '../application/getStats.js';
import { getGanancias } from '../application/getGanancias.js';

const conductores = new ConductorPostgresRepository();
const documentos = new DocumentoConductorPostgresRepository();
// TODO prod: cambiar por S3DocumentStorage cuando se decida el almacenamiento definitivo
const storage = new LocalDocumentStorage();
const disponibilidad = new DisponibilidadPostgresRepository();
export const sesiones = new SesionPostgresRepository();
const estadisticas = new EstadisticasPostgresRepository();

export const conductorUseCases = {
  submitLicencia: submitLicencia({ conductores, municipios: municipioRepository }),
  uploadDocumento: uploadDocumento({ conductores, documentos, storage }),
  getOnboarding: getOnboarding({ conductores, documentos }),
  reviewDocumento: reviewDocumento({ conductores, documentos }),
  listConductoresPendientes: listConductoresPendientes({ conductores }),
  getArchivo: getArchivo({ documentos, storage }),
  municipioOperativo: municipioOperativo({ conductores }),
  setDisponibilidad: setDisponibilidad({ disponibilidad, sesiones }),
  getDisponibilidad: getDisponibilidad({ disponibilidad }),
  getStats: getStats({ estadisticas }),
  getGanancias: getGanancias({ estadisticas, sesiones }),
};
