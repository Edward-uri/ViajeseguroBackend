import { BolsaPostgresRepository } from './BolsaPostgresRepository.js';
import { vehiculos, asignaciones } from '../../flotillas/infrastructure/dependencies.js';
import { pickPushSender } from '../../viajes/infrastructure/pushSenderFactory.js';
import { DispositivoPostgresRepository } from '../../viajes/infrastructure/DispositivoPostgresRepository.js';
import { ConductorPostgresRepository } from '../../conductores/infrastructure/ConductorPostgresRepository.js';
import { env } from '../../core/env.js';
import { crearVacante } from '../application/crearVacante.js';
import { editarVacante } from '../application/editarVacante.js';
import { listarVacantesAbiertas } from '../application/listarVacantesAbiertas.js';
import { misVacantes } from '../application/misVacantes.js';
import { cerrarVacante } from '../application/cerrarVacante.js';
import { postular } from '../application/postular.js';
import { retirarPostulacion } from '../application/retirarPostulacion.js';
import { listarPostulacionesDeVacante } from '../application/listarPostulacionesDeVacante.js';
import { misPostulaciones } from '../application/misPostulaciones.js';
import { aceptarPostulacion } from '../application/aceptarPostulacion.js';

export const bolsa = new BolsaPostgresRepository(asignaciones);
const conductores = new ConductorPostgresRepository();
const push = pickPushSender(env.FCM_SERVICE_ACCOUNT, new DispositivoPostgresRepository());

export const bolsaUseCases = {
  crearVacante: crearVacante({ bolsa, vehiculos }),
  editarVacante: editarVacante({ bolsa }),
  listarVacantesAbiertas: listarVacantesAbiertas({ bolsa }),
  misVacantes: misVacantes({ bolsa }),
  cerrarVacante: cerrarVacante({ bolsa }),
  postular: postular({ bolsa }),
  retirarPostulacion: retirarPostulacion({ bolsa }),
  listarPostulacionesDeVacante: listarPostulacionesDeVacante({ bolsa }),
  misPostulaciones: misPostulaciones({ bolsa }),
  aceptarPostulacion: aceptarPostulacion({ bolsa, conductores, push }),
};
