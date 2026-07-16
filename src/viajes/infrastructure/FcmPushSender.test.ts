import { describe, it, expect } from 'vitest';
import { esTokenInvalido } from './FcmPushSender.js';

describe('esTokenInvalido', () => {
  it('detecta los códigos de token muerto que reporta FCM', () => {
    expect(esTokenInvalido('messaging/registration-token-not-registered')).toBe(true);
    expect(esTokenInvalido('messaging/invalid-registration-token')).toBe(true);
  });

  it('errores transitorios NO dan de baja el token', () => {
    expect(esTokenInvalido('messaging/internal-error')).toBe(false);
    expect(esTokenInvalido('messaging/server-unavailable')).toBe(false);
    expect(esTokenInvalido(undefined)).toBe(false);
  });
});
