import { ReportePostgresRepository } from './ReportePostgresRepository.js';
import { ViajePostgresRepository } from '../../viajes/infrastructure/ViajePostgresRepository.js';
import { UserPostgresRepository } from '../../users/infrastructure/UserPostgresRepository.js';
import { SessionPostgresRepository } from '../../auth/infrastructure/SessionPostgresRepository.js';
import { pickPushSender } from '../../viajes/infrastructure/pushSenderFactory.js';
import { DispositivoPostgresRepository } from '../../viajes/infrastructure/DispositivoPostgresRepository.js';
import { env } from '../../core/env.js';
import { crearReporte } from '../application/crearReporte.js';
import { vetarConductor } from '../application/vetarConductor.js';
import { reactivarConductor } from '../application/reactivarConductor.js';
import { listarUsuariosReportados } from '../application/listarUsuariosReportados.js';
import { detalleUsuarioReportado } from '../application/detalleUsuarioReportado.js';

// Repo standalone (solo usa pool); lo importa viajes/dependencies para el gate de
// bloqueo en aceptarViaje/crearViaje. Se crea su propio repo de viajes para el
// porId de crearReporte (ViajePostgresRepository es no-arg → sin ciclos de deps).
export const reportes = new ReportePostgresRepository();
const viajes = new ViajePostgresRepository();
const users = new UserPostgresRepository();
const sessions = new SessionPostgresRepository();
const push = pickPushSender(env.FCM_SERVICE_ACCOUNT, new DispositivoPostgresRepository());

export const reportesUseCases = {
  crearReporte: crearReporte({ reportes, viajes }),
  vetarConductor: vetarConductor({ users, sessions, push }),
  reactivarConductor: reactivarConductor({ users, push }),
  listarUsuariosReportados: listarUsuariosReportados({ reportes }),
  detalleUsuarioReportado: detalleUsuarioReportado({ reportes }),
};
