import type { Vacante, VacanteConVehiculo, VacanteConPendientes, TipoTurno } from '../Vacante.js';
import type { Postulacion, PostulacionConConductor, PostulacionConVacante } from '../Postulacion.js';

export interface IBolsaRepository {
  crearVacante(args: { idPropietario: number; idVehiculo: number; idMunicipio: number; tipoTurno: TipoTurno; rentaTurno: number; dias: string[]; horario: string | null; condiciones: string | null }): Promise<Vacante>;
  editarVacante(args: { idVacante: number; tipoTurno: TipoTurno; rentaTurno: number; dias: string[]; horario: string | null; condiciones: string | null }): Promise<Vacante>;
  vacantePorId(idVacante: number): Promise<Vacante | null>;
  vacanteAbiertaPorVehiculo(idVehiculo: number): Promise<Vacante | null>;
  listarAbiertasPorMunicipio(idMunicipio: number): Promise<VacanteConVehiculo[]>;
  listarMisVacantes(idPropietario: number): Promise<VacanteConPendientes[]>;
  cerrarVacante(idVacante: number): Promise<Vacante>;

  crearPostulacion(args: { idVacante: number; idConductor: number; mensaje: string | null }): Promise<Postulacion>;
  postulacionPorId(idPostulacion: number): Promise<Postulacion | null>;
  retirarPostulacion(idPostulacion: number): Promise<Postulacion>;
  listarPostulacionesDeVacante(idVacante: number): Promise<PostulacionConConductor[]>;
  listarMisPostulaciones(idConductor: number): Promise<PostulacionConVacante[]>;

  /**
   * Transacción completa de aceptación (un solo client, un solo commit):
   * lock de postulación+vacante, valida estado/dueño, crea asignación origen='bolsa',
   * marca la elegida 'aceptada' y las demás 'pendiente' de la vacante 'rechazada', cierra la vacante.
   * Lanza PostulacionNoPendienteError / VacanteCerradaError / NoEsTuVacanteError (rollback automático).
   */
  aceptarPostulacion(args: { idPostulacion: number; idPropietario: number }): Promise<{
    postulacion: Postulacion;
    vacante: Vacante;
    rechazadosIdsConductor: number[];
  }>;
}
