import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { IOtpRepository } from '../domain/repositories/IOtpRepository.js';
import type { IOtpSender } from '../domain/IOtpSender.js';
import { generarCodigo, hashCodigo, TTL_MINUTOS } from '../domain/otp.js';
import { CredencialesError } from '../domain/errors.js';

export function startLogin(deps: {
  users: IUserRepository;
  otp: IOtpRepository;
  sender: IOtpSender;
}) {
  return async ({ correo }: { correo: string }): Promise<void> => {
    const user = await deps.users.findByCorreo(correo);
    if (!user || user.idUsuario === null) throw new CredencialesError();

    const codigo = generarCodigo();
    await deps.otp.crear({
      idUsuario: user.idUsuario,
      destino: correo,
      canal: 'email',
      proposito: 'login',
      codigoHash: await hashCodigo(codigo),
      expiraEn: new Date(Date.now() + TTL_MINUTOS * 60_000),
    });
    await deps.sender.enviar({ destino: correo, canal: 'email', codigo });
  };
}
