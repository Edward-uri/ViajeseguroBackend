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

const conductores = new ConductorPostgresRepository();
const documentos = new DocumentoConductorPostgresRepository();
// TODO prod: cambiar por S3DocumentStorage cuando se decida el almacenamiento definitivo
const storage = new LocalDocumentStorage();

export const conductorUseCases = {
  submitLicencia: submitLicencia({ conductores, municipios: municipioRepository }),
  uploadDocumento: uploadDocumento({ conductores, documentos, storage }),
  getOnboarding: getOnboarding({ conductores, documentos }),
  reviewDocumento: reviewDocumento({ conductores, documentos }),
  listConductoresPendientes: listConductoresPendientes({ conductores }),
  getArchivo: getArchivo({ documentos, storage }),
  municipioOperativo: municipioOperativo({ conductores }),
};
