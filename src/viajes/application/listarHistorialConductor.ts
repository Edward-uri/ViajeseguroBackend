import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';

/** Historial paginado del conductor (contrato uniforme de paginación) con filtros. */
export function listarHistorialConductor(deps: {
  viajes: Pick<IViajeRepository, 'listarHistorialConductor'>;
}) {
  return async (input: {
    idConductor: number; page: number; perPage: number;
    estado?: string | null; desde?: string | null; hasta?: string | null;
  }): Promise<{
    data: PublicViaje[]; page: number; perPage: number; total: number; totalPages: number;
  }> => {
    const { data, total } = await deps.viajes.listarHistorialConductor({
      idConductor: input.idConductor,
      limit: input.perPage,
      offset: (input.page - 1) * input.perPage,
      estado: input.estado ?? null,
      desde: input.desde ?? null,
      hasta: input.hasta ?? null,
    });
    return {
      data: data.map((v) => v.toJSON()),
      page: input.page,
      perPage: input.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.perPage)),
    };
  };
}
