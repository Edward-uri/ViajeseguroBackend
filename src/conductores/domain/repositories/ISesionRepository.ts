export interface ISesionRepository {
  /** Abre una sesión (inicio=now, fin=null) solo si el conductor no tiene una abierta. Idempotente. */
  abrir(idConductor: number): Promise<void>;
  /** Cierra la sesión abierta del conductor (fin=now). No-op si no hay abierta. */
  cerrar(idConductor: number): Promise<void>;
  /** Horas decimales en línea solapadas con [desdeTs, hastaTs] (ISO o Date). */
  horasEnLinea(idConductor: number, desdeTs: string, hastaTs: string): Promise<number>;
}
