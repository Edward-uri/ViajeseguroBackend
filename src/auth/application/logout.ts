import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import { verifyRefreshToken } from '../../core/jwt.js';

export function logout(deps: { sessions: ISessionRepository }) {
  return async ({ refreshToken }: { refreshToken: string }): Promise<void> => {
    try {
      const { sid } = verifyRefreshToken(refreshToken);
      await deps.sessions.revocar(sid);
    } catch {
    }
  };
}
