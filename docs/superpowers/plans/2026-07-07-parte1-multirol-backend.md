# Parte 1 — Multi-rol en backend (fase 1 aditiva) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introducir `usuario_roles` (M:N) como fuente de verdad de autorización y emitir JWT con `roles[]`, manteniendo `rol` (derivado) por compatibilidad con las apps instaladas.

**Architecture:** Migración aditiva en Postgres (tabla + backfill), helper `rolPrincipal()` en `core/jwt.ts`, `requireRole` por intersección con fallback a tokens viejos, lectura de roles vía `IUserRepository.getRoles()` en los 5 emisores de tokens, y `/me` exponiendo `roles`. Nada de este plan cambia requests de las apps (auditoría al final lo verifica).

**Tech Stack:** Node + TypeScript (ESM, imports `.js`), Express, pg, vitest, migraciones SQL planas vía `scripts/migrate.mjs`.

## Global Constraints

- Repo: `/Users/edward/Documents/Projects/ViajeseguroBackend`, rama `feature/multirol-bolsa-trabajo`.
- Spec: `docs/superpowers/specs/2026-07-07-identidad-multirol-bolsa-trabajo-design.md` (§3.1, §4, §5.5, §7 fase 1).
- Enum Postgres existente `rol_usuario` = `('pasajero','conductor','propietario','admin')` — NO se modifica.
- **Compatibilidad fase 1:** el JWT y `/me` siguen incluyendo `rol` (string único). Las apps no deben requerir cambios en esta parte.
- Convención de imports ESM con sufijo `.js` (p. ej. `from '../core/jwt.js'`).
- Comandos: `pnpm typecheck`, `pnpm test` (vitest), `pnpm db:migrate` (requiere la BD local del `docker-compose.yml` levantada).
- Commits con prefijos `feat:`/`test:`/`docs:` como el historial existente.
- `docs/` está en `.gitignore`: para commitear specs/planes usar `git add -f docs/superpowers/...`.

---

### Task 1: Migración `usuario_roles` + backfill

**Files:**
- Create: `db/migrations/020_usuario_roles.sql`

**Interfaces:**
- Produces: tabla `usuario_roles(id_usuario BIGINT, rol rol_usuario, created_at, PK(id_usuario,rol))` con backfill completo. Tasks 4-6 asumen que TODO usuario existente tiene ≥1 fila aquí.

- [ ] **Step 1: Escribir la migración**

```sql
-- db/migrations/020_usuario_roles.sql
BEGIN;

CREATE TABLE IF NOT EXISTS usuario_roles (
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  rol        rol_usuario NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, rol)
);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol ON usuario_roles(rol);

-- Backfill 1: cada usuario conserva su rol actual.
INSERT INTO usuario_roles (id_usuario, rol)
SELECT id_usuario, rol FROM usuarios
ON CONFLICT DO NOTHING;

-- Backfill 2: todo no-admin puede además pedir viajes (rol pasajero universal).
INSERT INTO usuario_roles (id_usuario, rol)
SELECT id_usuario, 'pasajero'::rol_usuario FROM usuarios WHERE rol <> 'admin'
ON CONFLICT DO NOTHING;

COMMIT;
```

- [ ] **Step 2: Correr la migración**

Run: `pnpm db:migrate`
Expected: aplica `020_usuario_roles.sql` sin error (el runner salta las ya aplicadas).

- [ ] **Step 3: Verificar backfill**

Run (psql contra la BD local):
```sql
SELECT u.rol AS rol_usuarios, COUNT(*) FROM usuarios u GROUP BY 1;
SELECT rol, COUNT(*) FROM usuario_roles GROUP BY 1;
SELECT COUNT(*) AS sin_roles FROM usuarios u
  WHERE NOT EXISTS (SELECT 1 FROM usuario_roles r WHERE r.id_usuario = u.id_usuario);
```
Expected: `sin_roles = 0`; cada no-admin tiene fila `pasajero`.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/020_usuario_roles.sql
git commit -m "feat: tabla usuario_roles con backfill (multi-rol fase 1)"
```

---

### Task 2: `roles[]` en el JWT + `rolPrincipal()`

**Files:**
- Modify: `src/core/jwt.ts`
- Test: `src/core/jwt.test.ts` (nuevo)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `AccessPayload = { sub: number; rol: Rol; roles: Rol[]; type: 'access' }`; `AuthTokenPayload = { sub: number; rol: Rol; roles?: Rol[] }`; `signAccessToken(p: { sub: number; roles: Rol[] }): string`; `rolPrincipal(roles: Rol[]): Rol`. Tasks 3 y 5 dependen de estas firmas exactas.

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/core/jwt.test.ts
import { describe, it, expect } from 'vitest';
import { rolPrincipal, signAccessToken, verifyAccessToken } from './jwt.js';

describe('rolPrincipal', () => {
  it('prioriza admin > propietario > conductor > pasajero', () => {
    expect(rolPrincipal(['pasajero', 'propietario'])).toBe('propietario');
    expect(rolPrincipal(['conductor', 'admin'])).toBe('admin');
    expect(rolPrincipal(['pasajero'])).toBe('pasajero');
    expect(rolPrincipal([])).toBe('pasajero'); // fallback defensivo
  });
});

describe('access token con roles[]', () => {
  it('firma y verifica sub, rol derivado y roles', () => {
    const token = signAccessToken({ sub: 7, roles: ['propietario', 'pasajero'] });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.roles).toEqual(['propietario', 'pasajero']);
    expect(payload.rol).toBe('propietario'); // compat fase 1
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `pnpm test src/core/jwt.test.ts`
Expected: FAIL — `rolPrincipal` no existe y `signAccessToken` no acepta `roles`.
Nota: el test necesita `JWT_SECRET`; si `core/env.ts` lo exige, correr con `JWT_SECRET=test pnpm test src/core/jwt.test.ts` (mismo prefijo en los steps siguientes).

- [ ] **Step 3: Implementar en `src/core/jwt.ts`**

Reemplazar los tipos/funciones de access token (el resto del archivo queda igual):

```ts
export type Rol = 'pasajero' | 'conductor' | 'propietario' | 'admin';

// fase 1: `rol` (principal, derivado) viaja junto a `roles` por compatibilidad.
export interface AccessPayload { sub: number; rol: Rol; roles: Rol[]; type: 'access'; }
export interface RefreshPayload { sub: number; sid: number; type: 'refresh'; }
export interface RegistrationPayload { correo: string; rol: Rol; type: 'registration'; }

// `roles` opcional: tokens emitidos antes del deploy solo traen `rol`.
export type AuthTokenPayload = { sub: number; rol: Rol; roles?: Rol[] };

const PRIORIDAD_ROL: Rol[] = ['admin', 'propietario', 'conductor', 'pasajero'];
export function rolPrincipal(roles: Rol[]): Rol {
  return PRIORIDAD_ROL.find((r) => roles.includes(r)) ?? 'pasajero';
}

export const signAccessToken = (p: { sub: number; roles: Rol[] }): string =>
  sign({ sub: p.sub, rol: rolPrincipal(p.roles), roles: p.roles, type: 'access' }, env.ACCESS_TOKEN_TTL);
```

(`sign`, `verify`, `verifyAccessToken`, refresh y registration quedan como están.)

- [ ] **Step 4: Verificar que pasa**

Run: `pnpm test src/core/jwt.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/jwt.ts src/core/jwt.test.ts
git commit -m "feat: access token con roles[] y rolPrincipal (compat fase 1)"
```

---

### Task 3: `requireRole` por intersección (con fallback a tokens viejos)

**Files:**
- Modify: `src/middleware/authMiddleware.ts` (función `requireRole`, líneas ~28-36)
- Test: `src/middleware/authMiddleware.test.ts` (nuevo)

**Interfaces:**
- Consumes: `AuthTokenPayload` de Task 2 (`roles?: Rol[]`).
- Produces: `requireRole(...permitidos: Rol[])` pasa si el usuario tiene ALGÚN rol permitido; tokens sin `roles` usan `[rol]`. Firma pública sin cambios — los 7 usos en `viajesRoutes.ts` no se tocan.

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/middleware/authMiddleware.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requireRole } from './authMiddleware.js';
import type { Request, Response } from 'express';

function reqWith(user: unknown): Request {
  return { user } as unknown as Request;
}
const res = {} as Response;

describe('requireRole con roles[]', () => {
  it('pasa si algún rol del usuario está permitido', () => {
    const next = vi.fn();
    requireRole('conductor')(reqWith({ sub: 1, rol: 'propietario', roles: ['propietario', 'conductor'] }), res, next);
    expect(next).toHaveBeenCalledWith(); // sin error
  });

  it('rechaza si no hay intersección', () => {
    const next = vi.fn();
    requireRole('admin')(reqWith({ sub: 1, rol: 'propietario', roles: ['propietario', 'pasajero'] }), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error); // ForbiddenError
  });

  it('token viejo sin roles[] usa rol único (compat)', () => {
    const next = vi.fn();
    requireRole('conductor')(reqWith({ sub: 1, rol: 'conductor' }), res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `pnpm test src/middleware/authMiddleware.test.ts`
Expected: FAIL — el primer test (rol propietario con roles que incluyen conductor) recibe ForbiddenError con la implementación actual.

- [ ] **Step 3: Implementar**

```ts
export function requireRole(...roles: NonNullable<AuthTokenPayload['roles']>): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    const userRoles = req.user.roles ?? [req.user.rol]; // compat: tokens pre-fase-1
    if (!roles.some((r) => userRoles.includes(r))) {
      return next(new ForbiddenError());
    }
    next();
  };
}
```

- [ ] **Step 4: Verificar que pasa**

Run: `pnpm test src/middleware/authMiddleware.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/middleware/authMiddleware.ts src/middleware/authMiddleware.test.ts
git commit -m "feat: requireRole por interseccion de roles[] con fallback a rol unico"
```

---

### Task 4: `getRoles`/`addRol` en el repositorio de usuarios

**Files:**
- Modify: `src/users/domain/repositories/IUserRepository.ts`
- Modify: `src/users/infrastructure/UserPostgresRepository.ts` (método `createUserWithPersona` ~línea 136, y agregar 2 métodos nuevos al final de la clase)

**Interfaces:**
- Consumes: tabla `usuario_roles` (Task 1); tipo `Rol` de `core/jwt.ts`.
- Produces: `getRoles(idUsuario: number): Promise<Rol[]>` y `addRol(idUsuario: number, rol: Rol): Promise<void>` en `IUserRepository`; `createUserWithPersona` inserta el rol inicial en `usuario_roles` dentro de su transacción. Task 5 consume `getRoles`.

- [ ] **Step 1: Ampliar la interfaz**

En `IUserRepository.ts`, agregar al inicio del archivo el import y dentro de la interfaz los dos métodos:

```ts
import type { Rol } from '../../../core/jwt.js';

// ... dentro de interface IUserRepository:
  /** Roles del usuario desde usuario_roles (fuente de verdad, ≥1 por backfill). */
  getRoles(idUsuario: number): Promise<Rol[]>;
  /** Agrega un rol (idempotente). */
  addRol(idUsuario: number, rol: Rol): Promise<void>;
```

- [ ] **Step 2: Implementar en `UserPostgresRepository.ts`**

Agregar los métodos a la clase (usar el pool/`query` igual que los métodos vecinos de la clase, p. ej. como `findById`):

```ts
  async getRoles(idUsuario: number): Promise<Rol[]> {
    const { rows } = await pool.query<{ rol: Rol }>(
      'SELECT rol FROM usuario_roles WHERE id_usuario = $1 ORDER BY rol',
      [idUsuario],
    );
    return rows.map((r) => r.rol);
  }

  async addRol(idUsuario: number, rol: Rol): Promise<void> {
    await pool.query(
      'INSERT INTO usuario_roles (id_usuario, rol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [idUsuario, rol],
    );
  }
```

Nota: si la clase no usa un `pool` importado sino otro helper de query, replicar EXACTAMENTE el patrón de `findById` (leer el archivo primero). Importar `Rol`: `import type { Rol } from '../../core/jwt.js';`.

- [ ] **Step 3: Insertar el rol inicial al crear usuario**

En `createUserWithPersona`, dentro del `withTransaction`, después del INSERT a `personas` y antes de `return created;`:

```ts
      await client.query(
        'INSERT INTO usuario_roles (id_usuario, rol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [created.idUsuario, user.rol],
      );
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: sin errores (los mocks de tests aún no implementan los métodos nuevos — si algún test mockea `IUserRepository` completo, agregar `getRoles: async () => ['pasajero']` y `addRol: async () => {}` a ese mock).

- [ ] **Step 5: Commit**

```bash
git add src/users/domain/repositories/IUserRepository.ts src/users/infrastructure/UserPostgresRepository.ts
git commit -m "feat: getRoles/addRol en repositorio de usuarios y rol inicial al crear"
```

---

### Task 5: `emitirTokens` con `roles[]` + 5 call sites

**Files:**
- Modify: `src/auth/application/sessionTokens.ts`
- Modify: `src/auth/application/verifyLogin.ts:26`
- Modify: `src/auth/application/loginPassword.ts:15`
- Modify: `src/auth/application/refreshSession.ts:18`
- Modify: `src/auth/application/completeRegistration.ts:44`
- Modify: `src/auth/application/aceptarInvitacion.ts:32`

**Interfaces:**
- Consumes: `signAccessToken({ sub, roles })` (Task 2); `users.getRoles()` (Task 4).
- Produces: `emitirTokens(sessions, idUsuario, roles: Rol[], dispositivo)` — cambia el 3er parámetro de `Rol` a `Rol[]`.

- [ ] **Step 1: Cambiar `sessionTokens.ts`**

```ts
export async function emitirTokens(
  sessions: ISessionRepository,
  idUsuario: number,
  roles: Rol[],
  dispositivo: string | null,
): Promise<{ accessToken: string; refreshToken: string }> {
  const expiraEn = new Date(Date.now() + DIAS_REFRESH * 86_400_000);
  const placeholder = await bcrypt.hash('pending', env.BCRYPT_ROUNDS);
  const { idSesion } = await sessions.crear({ idUsuario, refreshHash: placeholder, dispositivo, expiraEn });
  const refreshToken = signRefreshToken({ sub: idUsuario, sid: idSesion });
  await sessions.actualizarHash(idSesion, await bcrypt.hash(refreshToken, env.BCRYPT_ROUNDS));
  return { accessToken: signAccessToken({ sub: idUsuario, roles }), refreshToken };
}
```

- [ ] **Step 2: Actualizar los 5 call sites**

`verifyLogin.ts` (el `deps` ya incluye `users`):
```ts
    const roles = await deps.users.getRoles(user.idUsuario);
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, roles, dispositivo ?? null);
```

`loginPassword.ts` (mismo patrón; `deps.users` ya existe):
```ts
    const roles = await deps.users.getRoles(user.idUsuario);
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, roles, dispositivo ?? null);
```

`refreshSession.ts`:
```ts
    const roles = await deps.users.getRoles(user.idUsuario);
    return emitirTokens(deps.sessions, user.idUsuario, roles, null);
```

`completeRegistration.ts` (fase 1 conserva la semántica de un rol al registrarse; la Parte 2 la cambia):
```ts
    const tokens = await emitirTokens(deps.sessions, creado.idUsuario!, [creado.rol], input.dispositivo ?? null);
```

`aceptarInvitacion.ts`:
```ts
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, ['admin'], dispositivo ?? null);
```

- [ ] **Step 3: Typecheck + tests**

Run: `pnpm typecheck && pnpm test`
Expected: sin errores; los tests de Tasks 2-3 siguen en verde.

- [ ] **Step 4: Commit**

```bash
git add src/auth/application/
git commit -m "feat: emision de tokens con roles[] desde usuario_roles"
```

---

### Task 6: `/me` expone `roles`

**Files:**
- Modify: `src/users/application/getMe_UseCase.ts`
- Modify: `src/users/infrastructure/controllers/getMeController.ts` (leerlo primero; merge de `roles` en el JSON de respuesta)

**Interfaces:**
- Consumes: `users.getRoles()` (Task 4).
- Produces: respuesta de `GET /api/users/me` con campo nuevo `roles: Rol[]` junto al `rol` existente (aditivo — las apps actuales lo ignoran).

- [ ] **Step 1: Ampliar el use case**

```ts
import type { Rol } from '../../core/jwt.js';

export class GetMe_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(idUsuario: number): Promise<{ user: User; persona: PersonaPerfil | null; roles: Rol[] }> {
    const user = await this.userRepository.findById(idUsuario);
    if (!user) throw new UserNotFoundError();
    const persona = await this.userRepository.personaPorId(idUsuario);
    const roles = await this.userRepository.getRoles(idUsuario);
    return { user, persona, roles };
  }
}
```

- [ ] **Step 2: Propagar en el controller**

Leer `getMeController.ts` y agregar `roles` al objeto JSON que ya arma (donde hoy serializa `user`/`persona`, añadir la clave `roles` al mismo nivel que `rol`). Ejemplo del shape final esperado en la respuesta:

```json
{ "idUsuario": 7, "rol": "propietario", "roles": ["pasajero", "propietario"], "estadoCuenta": "activo" }
```

- [ ] **Step 3: Typecheck + smoke**

Run: `pnpm typecheck`
Expected: OK.
Smoke (con el server local `pnpm dev` y un token válido):
```bash
curl -s http://localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | grep -E '"rol|roles'
```
Expected: aparecen `rol` y `roles`.

- [ ] **Step 4: Commit**

```bash
git add src/users/
git commit -m "feat: /me expone roles[] (aditivo, compat fase 1)"
```

---

### Task 7: Verificación integral + auditoría de compatibilidad de las apps

**Files:**
- Ninguno nuevo (verificación); posibles fixes menores que salgan de ella.

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: evidencia de que backend fase 1 NO rompe las apps instaladas (criterio de salida de la Parte 1, spec §5.5).

- [ ] **Step 1: Suite completa y build**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: todo en verde.

- [ ] **Step 2: Smoke E2E de auth**

Con el backend local corriendo y la BD migrada:
1. Login (password u OTP) de un usuario conductor existente → decodificar el `accessToken` (jwt.io o `node -e`) → debe traer `rol` y `roles`.
2. `GET /api/viajes/pendientes` con ese token → 200 (el gate `requireRole('conductor')` sigue pasando).
3. `POST /api/auth/refresh` → el nuevo access token también trae `roles`.

- [ ] **Step 3: Auditoría de compatibilidad (apps, solo lectura)**

Verificar contra el checklist del spec §5.5 que en fase 1 NADA de lo que las apps envían/parsean cambió:

```bash
# Conductor: el parser exige 'rol' → el backend lo sigue mandando (rol derivado). Confirmar:
grep -n "json\['rol'\]" /Users/edward/Documents/Projects/viajeSeguroConductor/lib/shared/data/mappers/user_mapper.dart
# Pasajero: fallback ya tolerante:
grep -n "json\['rol'\]" /Users/edward/Documents/Projects/ViajeseguroApp/lib/shared/data/mappers/user_mapper.dart
```

Prueba manual mínima: app conductor contra backend local (`API_BASE_URL` al local en su `.env`) → login + ponerse disponible funciona igual que antes. Si algo truena aquí, es regresión de esta parte: arreglar antes de cerrar.

- [ ] **Step 4: Commit de cierre (si hubo fixes) y marcar la Parte 1 como lista**

```bash
git add -A && git commit -m "feat: multi-rol fase 1 completa (backend, compat verificada)"
```

---

## Self-review (hecho al escribir el plan)

- **Cobertura vs spec §8-parte-1:** tabla+backfill (T1), JWT roles[] (T2), requireRole intersección (T3), lectura de roles (T4-5), `/me` (T6), auditoría §5.5 (T7). ✔
- **Sin placeholders:** cada step tiene código o comando concreto; los 2 puntos donde el implementador debe leer el archivo primero (patrón de query del repo, shape del getMeController) están marcados explícitamente con qué buscar y el resultado esperado. ✔
- **Consistencia de tipos:** `signAccessToken({sub, roles})` (T2) = lo que usa `emitirTokens` (T5); `getRoles(): Promise<Rol[]>` (T4) = lo que consumen T5/T6; `AuthTokenPayload.roles?` (T2) = fallback de T3. ✔

## Fuera de este plan (partes siguientes)

- Parte 2: registro como `{propietario, pasajero}` + onboarding conductor progresivo (cambia `completeRegistration` y apps).
- Parte 3: `asignaciones_vehiculo`. Parte 4: bolsa. Parte 5: app pasajero/panel. Parte 6: drop `usuarios.rol`.
