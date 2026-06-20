import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { IOtpRepository } from '../domain/repositories/IOtpRepository.js';
import type { IOtpSender } from '../domain/IOtpSender.js';
import { generarCodigo, hashCodigo, TTL_MINUTOS } from '../domain/otp.js';
import { CorreoYaRegistradoError } from '../domain/errors.js';

export function startRegistration(deps: {
  users: IUserRepository;
  otp: IOtpRepository;
  sender: IOtpSender;
}) {
  return async ({ correo }: { correo: string }): Promise<void> => {
    const existente = await deps.users.findByCorreo(correo);
    if (existente) throw new CorreoYaRegistradoError();

    const codigo = generarCodigo();
    await deps.otp.crear({
      idUsuario: null,
      destino: correo,
      canal: 'email',
      proposito: 'registro',
      codigoHash: await hashCodigo(codigo),
      expiraEn: new Date(Date.now() + TTL_MINUTOS * 60_000),
    });
    await deps.sender.enviar({ destino: correo, canal: 'email', codigo });
  };
}
