import { MunicipioPostgresRepository } from './MunicipioPostgresRepository.js';
import { listMunicipios } from '../application/listMunicipios.js';

export const municipioRepository = new MunicipioPostgresRepository();

export const municipioUseCases = {
  listMunicipios: listMunicipios({ municipios: municipioRepository }),
};
