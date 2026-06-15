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
  return async ({ identificador }: { identificador: string }): Promise<void> => {
    const user = await deps.users.findByIdentificador(identificador);
    if (!user || user.idUsuario === null) throw new CredencialesError();

    const canal = identificador.includes('@') ? ('email' as const) : ('sms' as const);
    const codigo = generarCodigo();
    await deps.otp.crear({
      idUsuario: user.idUsuario,
      destino: identificador,
      canal,
      proposito: 'login',
      codigoHash: await hashCodigo(codigo),
      expiraEn: new Date(Date.now() + TTL_MINUTOS * 60_000),
    });
    await deps.sender.enviar({ destino: identificador, canal, codigo });
  };
}
