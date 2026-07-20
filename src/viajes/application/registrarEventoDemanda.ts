import type { ISenalesMlRepository } from '../domain/repositories/ISenalesMlRepository.js';

export interface EventoDemandaInput {
  idUsuario: number;
  tipo: 'apertura_solicitud' | 'cotizacion';
  lat: number;
  lng: number;
  idMunicipio?: number;
}

const ANTISPAM_SEGUNDOS = 60;

/** Registra un evento de demanda. Anti-spam: ignora repeticiones del mismo tipo <60s. */
export function registrarEventoDemanda(deps: { senales: ISenalesMlRepository }) {
  return async (input: EventoDemandaInput): Promise<void> => {
    if (await deps.senales.huboEventoReciente(input.idUsuario, input.tipo, ANTISPAM_SEGUNDOS)) return;
    const idMunicipio = input.idMunicipio ?? null;
    const nConductoresDisponibles = await deps.senales.contarConductoresDisponibles(idMunicipio);
    await deps.senales.registrarEvento({
      idUsuario: input.idUsuario,
      tipo: input.tipo,
      lat: input.lat,
      lng: input.lng,
      idMunicipio,
      nConductoresDisponibles,
    });
  };
}
