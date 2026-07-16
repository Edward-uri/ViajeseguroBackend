import { describe, it, expect } from 'vitest';
import { randomBytes } from 'node:crypto';
import { EnvelopeCipher } from './EnvelopeCipher.js';
import { AesGcmCipher } from './AesGcmCipher.js';
import type { TenantKeyService } from './TenantKeyService.js';
import { runConTenant } from '../../core/tenantContext.js';

const INDEX_KEY = Buffer.alloc(32, 9);
const globalCipher = new AesGcmCipher(Buffer.alloc(32, 7), INDEX_KEY);
const key3 = randomBytes(32);

// Stub del servicio de llaves: el municipio 3 tiene llave, el resto no.
const keys = {
  keyDe: (id: number) => (id === 3 ? key3 : undefined),
  asegurarKey: () => {},
} as unknown as TenantKeyService;

const envelope = new EnvelopeCipher(globalCipher, keys, INDEX_KEY);
const conTenant = <T>(t: number | null, fn: () => T) => runConTenant({ tenant: t, isAdmin: false }, fn);

describe('EnvelopeCipher', () => {
  it('con tenant y llave: blob v2:<municipio>: y roundtrip', () => {
    const blob = conTenant(3, () => envelope.cifrar('hola'));
    expect(blob.startsWith('v2:3:')).toBe(true);
    expect(envelope.descifrar(blob)).toBe('hola'); // descifra sin contexto: el prefijo decide
  });

  it('sin tenant (admin/jobs) o sin llave: cae a v1 global', () => {
    const sinCtx = envelope.cifrar('hola');
    const sinLlave = conTenant(9, () => envelope.cifrar('hola'));
    expect(sinCtx.startsWith('v1:')).toBe(true);
    expect(sinLlave.startsWith('v1:')).toBe(true);
    expect(envelope.descifrar(sinCtx)).toBe('hola');
  });

  it('los blobs v1 viejos siguen siendo legibles', () => {
    const viejo = globalCipher.cifrar('legacy');
    expect(envelope.descifrar(viejo)).toBe('legacy');
  });

  it('bytes: v2 con municipio en el header y roundtrip; v1 legible', () => {
    const contenido = randomBytes(64);
    const v2 = conTenant(3, () => envelope.cifrarBytes(contenido));
    expect(v2[0]).toBe(2);
    expect(envelope.descifrarBytes(v2).equals(contenido)).toBe(true);
    const v1 = globalCipher.cifrarBytes(contenido);
    expect(envelope.descifrarBytes(v1).equals(contenido)).toBe(true);
  });

  it('blindIndex es global: igual con y sin tenant (regla del login)', () => {
    const con = conTenant(3, () => envelope.blindIndex('a@b.com'));
    expect(con).toBe(envelope.blindIndex('a@b.com'));
    expect(con).toBe(globalCipher.blindIndex('a@b.com'));
  });
});
