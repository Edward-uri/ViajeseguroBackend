import { ReportePostgresRepository } from './ReportePostgresRepository.js';
import { ViajePostgresRepository } from '../../viajes/infrastructure/ViajePostgresRepository.js';
import { crearReporte } from '../application/crearReporte.js';

// Repo standalone (solo usa pool); lo importa viajes/dependencies para el gate de
// bloqueo en aceptarViaje/crearViaje. Se crea su propio repo de viajes para el
// porId de crearReporte (ViajePostgresRepository es no-arg → sin ciclos de deps).
export const reportes = new ReportePostgresRepository();
const viajes = new ViajePostgresRepository();

export const reportesUseCases = {
  crearReporte: crearReporte({ reportes, viajes }),
};
