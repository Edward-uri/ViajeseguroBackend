import type { IDispositivoRepository } from '../domain/repositories/IDispositivoRepository.js';

export function registrarDispositivo(deps: { dispositivos: IDispositivoRepository }) {
  return async (idUsuario: number, input: { tokenFcm: string; plataforma: 'android' | 'ios' }): Promise<{ ok: true }> => {
    await deps.dispositivos.upsert({ idUsuario, tokenFcm: input.tokenFcm, plataforma: input.plataforma });
    return { ok: true };
  };
}
