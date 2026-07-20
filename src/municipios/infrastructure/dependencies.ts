import { MunicipioPostgresRepository } from './MunicipioPostgresRepository.js';
import { listMunicipios } from '../application/listMunicipios.js';
import { crearMunicipio } from '../application/crearMunicipio.js';
import { OsmPerimetroProvider } from './OsmPerimetroProvider.js';

export const municipioRepository = new MunicipioPostgresRepository();

export const municipioUseCases = {
  listMunicipios: listMunicipios({ municipios: municipioRepository }),
  crearMunicipio: crearMunicipio({ municipios: municipioRepository, perimetros: new OsmPerimetroProvider() }),
};
