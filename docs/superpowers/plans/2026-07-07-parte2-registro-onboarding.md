# Parte 2 — Registro propietario+pasajero y onboarding progresivo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El registro desde la app conductor crea usuarios `{propietario, pasajero}` sin pedir licencia; el rol `conductor` se otorga al aprobarse todos los documentos ("quiero manejar" progresivo).

**Architecture:** Backend primero (mapeo de roles en registro + gate de onboarding relajado + `addRol('conductor')` al aprobar docs), app conductor después (rol `propietario`, licencia fuera del flujo, gate de documentos invertido: home directo + CTA "quiero manejar"). E2E integral al cierre, incluyendo el path de socket multi-rol (regla del review final de Parte 1).

**Tech Stack:** Node+TS ESM (backend), Flutter/Riverpod/go_router (app conductor), vitest, migración 020 ya aplicada.

## Global Constraints

- Repos/rama: `ViajeseguroBackend` y `viajeSeguroConductor`, rama `feature/multirol-bolsa-trabajo`. NO push, NO merge (decisión: merge único al final del proyecto).
- Parte 1 ya landed: `usuario_roles`, JWT `roles[]`+`rol` derivado, `requireRole` intersección, `users.getRoles/addRol`, `/me` con `roles[]`, sockets con `roles.includes`.
- **Compatibilidad**: la app conductor INSTALADA (vieja) manda `rol:'conductor'` en el registro y espera el flujo de docs — debe seguir funcionando contra el backend nuevo (el mapeo ocurre server-side; el gate relajado la deja pasar).
- **Documentación de API SIEMPRE al día**: cambios de contrato/semántica actualizan el registro OpenAPI del módulo en el mismo commit.
- La columna `usuarios.rol` sigue existiendo (cae en Parte 6); para registro propietario se escribe `'propietario'`.
- Enfoque UI: **minimalista y funcional** — las vistas nuevas nacen simples (banner/CTA de una línea, sin decoración extra). Lógica primero, estilos después.
- Backend: imports ESM `.js`, commits `feat:`/`fix:`/`test:`/`docs:`. App: `flutter analyze` limpio en archivos tocados; commits solo con archivos propios (existe `api_client.dart` modificado del usuario — NO tocarlo ni commitearlo).
- Entorno local backend: Postgres Homebrew (`viajeseguro`/`viajeseguro_dev`), sin Docker; `.env` NO se modifica (overrides inline; ver `.superpowers/sdd/task-1-report.md`). Tests: vitest, un archivo por invocación, `JWT_SECRET=test` si hace falta.

---

### Task 1 (Backend): Registro multi-rol `{propietario, pasajero}` + fila en `propietarios`

**Files:**
- Modify: `src/auth/application/completeRegistration.ts`
- Modify: `src/users/domain/repositories/IUserRepository.ts` (firma `createUserWithPersona`)
- Modify: `src/users/infrastructure/UserPostgresRepository.ts:136-182` (`createUserWithPersona`)
- Modify: `src/auth/infrastructure/dependencies.ts` (o donde se construyan los deps de authUseCases — inyectar `propietarios`)
- Modify: `src/auth/infrastructure/openapi.ts` (descripciones de register start/verify/complete: semántica del rol)
- Test: `src/auth/application/completeRegistration.test.ts` (nuevo)

**Interfaces:**
- Consumes: `IPropietarioRepository.asegurarExiste(idPropietario)` (ya existe en `src/flotillas/domain/repositories/IPropietarioRepository.ts:4-6`); `usuario_roles` y `addRol` semantics de Parte 1.
- Produces: `createUserWithPersona({ user, persona, passwordHash?, roles })` — nuevo param `roles: Rol[]` (obligatorio); inserta TODAS las filas en `usuario_roles` dentro de la transacción. `completeRegistration` mapea: rol solicitado `'conductor' | 'propietario'` → `usuarios.rol='propietario'`, `roles=['propietario','pasajero']`, y llama `propietarios.asegurarExiste(idUsuario)` tras crear; `'pasajero'` → `roles=['pasajero']` sin fila propietario.

- [ ] **Step 1: Test primero (mocks de repos, sin BD)**

```ts
// src/auth/application/completeRegistration.test.ts
import { describe, it, expect, vi } from 'vitest';
import { completeRegistration } from './completeRegistration.js';
import { signRegistrationToken } from '../../core/jwt.js';

function makeDeps() {
  const created = { idUsuario: 42, rol: 'propietario', toPublicJSON: () => ({ idUsuario: 42, rol: 'propietario' }) };
  return {
    created,
    users: { createUserWithPersona: vi.fn(async (args: any) => ({ ...created, rol: args.user?.rol ?? 'propietario' })) },
    sessions: { crear: vi.fn(async () => ({ idSesion: 1 })), actualizarHash: vi.fn(async () => {}) },
    propietarios: { asegurarExiste: vi.fn(async () => {}) },
  } as any;
}

const base = { nombre: 'Ana', apellidoPaterno: 'Diaz' };

describe('completeRegistration multi-rol', () => {
  it("registro 'conductor' crea {propietario,pasajero} + fila propietarios", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'a@b.c', rol: 'conductor' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    const args = deps.users.createUserWithPersona.mock.calls[0][0];
    expect(args.roles.sort()).toEqual(['pasajero', 'propietario']);
    expect(args.user.rol).toBe('propietario'); // columna legacy
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalledWith(42);
  });

  it("registro 'propietario' idem", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'p@b.c', rol: 'propietario' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    expect(deps.users.createUserWithPersona.mock.calls[0][0].roles.sort()).toEqual(['pasajero', 'propietario']);
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalled();
  });

  it("registro 'pasajero' NO crea propietario", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'x@b.c', rol: 'pasajero' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    const args = deps.users.createUserWithPersona.mock.calls[0][0];
    expect(args.roles).toEqual(['pasajero']);
    expect(args.user.rol).toBe('pasajero');
    expect(deps.propietarios.asegurarExiste).not.toHaveBeenCalled();
  });
});
```

Ajustar los mocks a las firmas reales al leer los archivos (p. ej. `emitirTokens` usa `sessions.crear/actualizarHash` — si el shape difiere, espejar el real). `JWT_SECRET=test` si el env lo exige.

- [ ] **Step 2: RED** — `pnpm test src/auth/application/completeRegistration.test.ts` falla (no existe `roles` ni `propietarios` en deps).

- [ ] **Step 3: Implementar**

`completeRegistration.ts` — tras `verifyRegistrationToken`:

```ts
    const { correo, rol } = verifyRegistrationToken(input.registrationToken);
    // Parte 2: la app conductor registra propietarios (aunque la app vieja mande 'conductor').
    const esPropietario = rol === 'conductor' || rol === 'propietario';
    const rolLegacy: Rol = esPropietario ? 'propietario' : 'pasajero';
    const roles: Rol[] = esPropietario ? ['propietario', 'pasajero'] : ['pasajero'];
```

`UserBuilder().rol(rolLegacy)`; `createUserWithPersona({ user, persona, passwordHash, roles })`; tras crear: `if (esPropietario) await deps.propietarios.asegurarExiste(creado.idUsuario!);` (idempotente; si falla, flotillas la auto-crea en el primer uso — no abortar el registro: envolver en try/catch con log). `emitirTokens(deps.sessions, creado.idUsuario!, roles, ...)`.

`IUserRepository.createUserWithPersona` gana `roles: Rol[]`; la impl reemplaza el INSERT único de `usuario_roles` (líneas 175-178) por un loop sobre `roles` (mismo `client`, mismo `ON CONFLICT DO NOTHING`).

Wiring: agregar `propietarios` a los deps de auth (leer `src/auth/infrastructure/dependencies.ts` y el módulo flotillas para importar el repo ya instanciado — reusar la instancia, no crear otra).

OpenAPI (`src/auth/infrastructure/openapi.ts`): actualizar la descripción del campo `rol` en register start/verify: "conductor|propietario ⇒ la cuenta se crea como propietario+pasajero; el rol conductor se obtiene al aprobar documentos".

- [ ] **Step 4: GREEN** — 3/3; `pnpm typecheck` limpio; `pnpm test` (resto) verde.

- [ ] **Step 5: Commit** — `feat: registro crea propietario+pasajero con fila en propietarios (parte 2)`

---

### Task 2 (Backend): Gate de onboarding relajado a propietario

**Files:**
- Modify: `src/conductores/infrastructure/routes/conductorRoutes.ts:8`
- Test: `src/middleware/authMiddleware.test.ts` (ampliar con 1 caso) — el router no tiene harness HTTP; el comportamiento del gate ya está probado por unidad, aquí solo se asserta la combinación.

**Interfaces:**
- Consumes: `requireRole` de Parte 1.
- Produces: onboarding/documentos accesibles con `propietario` O `conductor` en `roles[]`.

- [ ] **Step 1: Cambio**

```ts
conductorRoutes.use(authMiddleware, requireRole('conductor', 'propietario'));
```

(Una línea. `asegurarExiste` en `uploadDocumento.ts:25` ya auto-crea la fila `conductores` en el primer upload — el propietario que sube su primer documento queda registrado como conductor-en-proceso sin código extra.)

- [ ] **Step 2: Test** — en `authMiddleware.test.ts` agregar:

```ts
  it('pasajero puro NO pasa un gate conductor|propietario', () => {
    const next = vi.fn();
    requireRole('conductor', 'propietario')(reqWith({ sub: 1, rol: 'pasajero', roles: ['pasajero'] }), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
```

Run: 4/4 en el archivo. Typecheck limpio.

- [ ] **Step 3: Commit** — `feat: onboarding de conductor accesible para propietarios (parte 2)`

---

### Task 3 (Backend): `addRol('conductor')` al aprobar todos los documentos

**Files:**
- Modify: `src/conductores/application/reviewDocumento.ts` (bloque líneas 31-37)
- Modify: deps/wiring del módulo conductores (inyectar `users` con `addRol` — leer `src/conductores/infrastructure/dependencies.ts` o equivalente)
- Test: `src/conductores/application/reviewDocumento.test.ts` (nuevo, con mocks)

**Interfaces:**
- Consumes: `users.addRol(idUsuario, 'conductor')` (Parte 1, idempotente).
- Produces: al quedar `estadoVerificacion === 'aprobado'`, el usuario gana el rol `conductor` (además del log `habilitado` existente). Su próximo login/refresh emite token con `conductor` en `roles[]`.

- [ ] **Step 1: Test primero** (mocks: `documentos.revisar`, docs list con todos aprobados vs uno pendiente; asertar que `users.addRol` se llama solo en el caso aprobado, con `(idConductor, 'conductor')`; y que `registrarCambioEstatus` se sigue llamando). Leer `reviewDocumento.ts` para espejar las firmas reales de los deps en los mocks. Mínimo 2 casos.

- [ ] **Step 2: RED → Implementar** — dentro del `if (estadoVerificacion === 'aprobado')` existente:

```ts
      await deps.users.addRol(idConductor, 'conductor');
```

(más el wiring del dep). El orden: addRol ANTES de `registrarCambioEstatus` para que un fallo de rol no deje al conductor "habilitado" sin rol; si `addRol` lanza, el review completo falla y el admin reintenta (aceptable e idempotente).

- [ ] **Step 3: GREEN** — tests del archivo + typecheck + `pnpm test` completo verde.

- [ ] **Step 4: Commit** — `feat: aprobar documentos otorga rol conductor (parte 2)`

---

### Task 4 (App conductor): Registro como propietario, licencia fuera del flujo

**Files:**
- Modify: `lib/features/auth/presentation/provider/register_viewmodel.dart:127,151` (rol `'conductor'` → `'propietario'`)
- Modify: `lib/features/auth/presentation/screens/registration/register_municipio_screen.dart:25` (navegar a `registerPhoto` en vez de `license`)
- Modify: `lib/features/auth/presentation/provider/register_viewmodel.dart` (`completeRegistration()` ~172: ya no depende de datos de licencia — verificar que el camino sin licencia quede limpio; el guardado soft de licencia líneas 187-198 se ELIMINA de este flujo, `guardarLicencia` queda para el onboarding)
- Modify: `lib/features/auth/presentation/screens/registration/register_photo_screen.dart:40` (`context.go(documents)` → `context.go(driverHome)`)
- Test: `flutter analyze` en los archivos tocados + smoke manual queda para Task 7.

**Interfaces:**
- Consumes: backend Task 1 (mapeo server-side — la app manda `'propietario'` explícito).
- Produces: flujo de registro = getstarted → email → otp → names → personalData → municipio → photo → **driverHome directo**. La pantalla `/license` y `guardarLicencia()` NO se borran: se reutilizan en el onboarding (Task 5).

- [ ] Steps: leer cada archivo → aplicar los 4 cambios → `flutter analyze` limpio → commit `feat: registro como propietario sin licencia (parte 2)` (solo archivos propios).

---

### Task 5 (App conductor): Gate invertido — home directo + "Quiero manejar"

**Files:**
- Modify: `lib/features/splash/...splash_screen.dart:46` (quitar `resolveDocumentsRoute`: con sesión → `driverHome`)
- Modify: `lib/features/rides/presentation/screens/driver_home_screen.dart:33-40` (quitar el redirect por documentos del `initState`)
- Modify: `lib/features/rides/presentation/screens/driver_home_screen.dart` (banner minimalista bajo `_OnlineStatusBar`: si `!user.esConductor` → una línea "Completa tu registro de conductor para recibir viajes →" que hace `context.push(AppRoutes.documents)`; ocultar el `Switch` de online en ese caso)
- Modify: `lib/features/rides/presentation/provider/home_viewmodel.dart` (exponer `esConductor` desde el user de `_profileRepository.getMe()` que ya carga en `loadData()`; usar `rolesEfectivos` del prep)
- Modify: `lib/features/profile/presentation/screens/driver_profile_screen.dart:227-236` (ítem "Mis documentos" visible SIEMPRE; renombrar a "Quiero manejar · Documentos" cuando `!esConductor`)
- NO tocar: `resolveDocumentsRoute` en sí (lo sigue usando el flujo de documents internamente), `toggleOnline` (sus validaciones de docs/vehículo quedan como segunda línea de defensa).

**Interfaces:**
- Consumes: `User.esConductor`/`rolesEfectivos` (prep cf39990); `/me` con `roles[]` (Parte 1).
- Produces: propietario sin rol conductor usa el home (mapa, vehículos, perfil) sin bloqueo; el camino a documentos es opt-in.

- [ ] Steps: leer archivos → cambios → banner con estilo existente del home (sin decoración nueva — minimalista) → `flutter analyze` limpio → commit `feat: home directo para propietarios + CTA quiero manejar (parte 2)`.

---

### Task 6 (Backend): OpenAPI/documentación de onboarding

**Files:**
- Modify: `src/conductores/infrastructure/openapi.ts` (o donde estén registrados los endpoints de onboarding/documentos — buscar con `grep -rn "onboarding" src/docs src/conductores/infrastructure --include="*.ts"`)

**Interfaces:** ninguna nueva — solo contrato documentado.

- [ ] Actualizar descripciones: onboarding/documentos aceptan rol `propietario` (además de `conductor`); la aprobación total otorga el rol `conductor` automáticamente. Verificar generación del doc (patrón del task-6-report de Parte 1: script con `OpenApiGeneratorV31`). Commit `docs: openapi de onboarding refleja acceso propietario y otorgamiento de rol (parte 2)`.
(Si Task 1 ya cubrió register y Task 2/3 no cambiaron schemas, esta tarea es solo descripciones — si resulta vacía tras leer, documentar por qué y cerrar sin commit.)

---

### Task 7 (E2E): Verificación integral Parte 2

**Files:** ninguno (verificación; fixes solo si hay regresión real).

Receta (mismo estilo que T7 de Parte 1 — claves efímeras, DB Homebrew, sin OTP; leer `.superpowers/sdd/task-1-report.md` y `task-7-report.md` para el env):
1. `pnpm test && pnpm typecheck && pnpm build` verdes.
2. Server arriba. **Registro HTTP REAL** (no seed directo): `register/start` → OTP: leer el código del flujo o de la BD `codigos_otp` (hash — si no es recuperable, usar el seed-script del T7 previo PERO con `roles=['propietario','pasajero']` y fila `propietarios` manual, y anotar que el flujo HTTP de registro queda cubierto por los tests unitarios de Task 1) → `register/complete` sin licencia → token: `rol='propietario'`, `roles=['propietario','pasajero']`.
3. Con ese token: `GET /api/conductor/onboarding` → NO 403 (gate relajado, Task 2). Subir un documento dummy → 2xx y fila `conductores` auto-creada.
4. Aprobar TODOS los docs vía el endpoint admin (sembrar un admin o token admin) → verificar en BD `usuario_roles` que apareció `conductor` (Task 3).
5. `POST /api/auth/refresh` → token nuevo con `conductor` en roles.
6. **Socket path multi-rol (regla del review final Parte 1)**: con el token refrescado (principal `propietario`, roles incluyen `conductor`), conectar socket.io y emitir `conductor:online` → ack `{ok:true}` (prueba viva del fix 0234f34).
7. Auditoría apps: conductor manda `rol:'propietario'` (Task 4) y el registro viejo (`'conductor'`) sigue funcionando contra el backend nuevo (probar `register/start` con `rol:'conductor'` → misma cuenta propietario). Pasajero: sin cambios.
8. Limpieza de datos de prueba POR `id_usuario` (nota del T7 previo: no por columnas plaintext).
Reporte a `.superpowers/sdd/parte2-task-7-report.md`.

---

## Self-review (hecho al escribir el plan)

- **Cobertura spec §5.1-5.2 + flujos 1-2:** registro multi-rol+propietarios (T1), onboarding accesible (T2), otorgamiento conductor (T3), app registro (T4), gate invertido+CTA (T5), OpenAPI (T1/T6), E2E+socket multi-rol (T7). La regla "socket path E2E" del review final de Parte 1 está en T7.6. ✔
- **Placeholders:** los pasos de app (T4/T5) anclan a file:line del explorador y nombran el cambio exacto; los tests de T1 traen código completo; T3 especifica los 2 casos mínimos del test. ✔
- **Consistencia:** `createUserWithPersona({..., roles})` (T1) es la única firma nueva compartida; `esConductor` viene del prep ya commiteado. Orden addRol→registrarCambioEstatus justificado en T3. ✔
- **Riesgo señalado:** T7.2 — el flujo HTTP completo de registro depende de poder resolver el OTP en local; el plan da el fallback explícito.
