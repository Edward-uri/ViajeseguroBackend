import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenant: number | null;
  isAdmin: boolean;
}

const als = new AsyncLocalStorage<TenantContext>();

export const runConTenant = <T>(ctx: TenantContext, fn: () => T): T => als.run(ctx, fn);

export const tenantActual = (): TenantContext | undefined => als.getStore();
