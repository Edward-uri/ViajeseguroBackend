import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenant: number | null;
  isAdmin: boolean;
  // sub del JWT: habilita la "puerta de dueño/conductor" en RLS (ver migración
  // 033). Opcional: los contextos de sistema/socket no lo necesitan.
  userId?: number | null;
}

const als = new AsyncLocalStorage<TenantContext>();

export const runConTenant = <T>(ctx: TenantContext, fn: () => T): T => als.run(ctx, fn);

export const tenantActual = (): TenantContext | undefined => als.getStore();
