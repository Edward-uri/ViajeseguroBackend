/** Puerto para consultar bloqueos derivados de reportes (lo implementa el repo
 *  de reportes). El bloqueo es mutuo: si existe reporte entre A y B en cualquier
 *  dirección, no se les asigna un viaje juntos. */
export interface IBloqueoChecker {
  estanBloqueados(idA: number, idB: number): Promise<boolean>;
  usuariosBloqueadosCon(idUsuario: number): Promise<number[]>;
}
