import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { IDispositivoRepository } from '../domain/repositories/IDispositivoRepository.js';
import { FcmPushSender } from './FcmPushSender.js';
import { LogPushSender } from './LogPushSender.js';

export function pickPushSender(serviceAccountBase64: string | undefined, dispositivos: IDispositivoRepository): IPushSender {
  return serviceAccountBase64 ? new FcmPushSender(dispositivos, serviceAccountBase64) : new LogPushSender();
}
