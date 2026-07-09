# Parte 3 — Vehículo activo por conductor — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada conductor tiene UN vehículo activo (default: el primero que registre); el backend lo deriva al aceptar viajes (el `idVehiculo` del cliente pasa a opcional/compat) y la app lo muestra y permite cambiarlo.

**Architecture (decisión de reconciliación):** NO se crea la tabla `asignaciones_vehiculo` del spec §3.2 ni se altera la semántica de `asignaciones_conductor_vehiculo` (010 = AUTORIZACIÓN vigente: quién puede manejar qué; `conductorAutorizado` hace UNION dueño+asignación). La SELECCIÓN activa es una columna nueva: `conductores.id_vehiculo_activo` (NULL = sin selección). `origen propia|bolsa` se difiere a la Parte 4 (YAGNI aquí). Autoasignación en 2 hooks: al registrar el primer vehículo (si ya es conductor) y al ganar el rol conductor (si ya tiene vehículos).

**Tech Stack:** Igual que P1/P2 (Node+TS ESM, vitest; Flutter/Riverpod). Incluye los tickets heredados del triage P2: f1 (splash preflight), f2+f4 (dead-code licencia/docs), polish del Switch.

## Global Constraints

- Repos/rama: `ViajeseguroBackend` y `viajeSeguroConductor`, rama `feature/multirol-bolsa-trabajo`. NO push, NO merge.
- Compat: la app instalada SIGUE mandando `idVehiculo` en aceptar — el backend lo acepta como siempre (opcional ≠ eliminado). Nada de esta parte puede romper el flujo actual de aceptar viaje.
- **OpenAPI al día** en el mismo commit de cada cambio de contrato.
- Backend: ESM `.js`, TDD con vitest (un archivo por invocación, `JWT_SECRET=test` si aplica), commits `feat:`/`fix:`. App: `flutter analyze` limpio en lo tocado; NO tocar `lib/core/http/api_client.dart` (mod local del usuario); UI minimalista.
- Entorno backend local: Postgres Homebrew `viajeseguro`/`viajeseguro_dev` (overrides inline, ver `.superpowers/sdd/task-1-report.md` de P1); claves cipher efímeras para smoke (patrón `parte2-task-7-report.md`).
- Reportes de agentes: `.superpowers/sdd/parte3-task-N-report.md`.

---

### Task 1 (Backend): Migración `021_vehiculo_activo.sql` + autoasignación al registrar vehículo

**Files:**
- Create: `db/migrations/021_vehiculo_activo.sql`
- Modify: `src/flotillas/application/registrarVehiculo.ts` (~líneas 12-26, tras crear el vehículo)
- Modify: `src/conductores/domain/repositories/IConductorRepository.ts` + `src/conductores/infrastructure/ConductorPostgresRepository.ts` (2 métodos nuevos)
- Test: `src/flotillas/application/registrarVehiculo.test.ts` (nuevo, mocks)

**Interfaces:**
- Produces (Tasks 2-4 consumen): `IConductorRepository.getVehiculoActivo(idConductor): Promise<number | null>` y `setVehiculoActivo(idConductor, idVehiculo | null): Promise<void>` (UPDATE simple; no valida autorización — eso es del use case).

- [ ] **Step 1: Migración**

```sql
-- db/migrations/021_vehiculo_activo.sql
BEGIN;
ALTER TABLE conductores
  ADD COLUMN IF NOT EXISTS id_vehiculo_activo BIGINT REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL;
COMMIT;
```

Run: `pnpm db:migrate` (env inline) → aplica limpio. Idempotente por IF NOT EXISTS.

- [ ] **Step 2: Métodos de repo** — en `ConductorPostgresRepository` (patrón `pool.query` de la clase):

```ts
  async getVehiculoActivo(idConductor: number): Promise<number | null> {
    const { rows } = await pool.query<{ id_vehiculo_activo: string | null }>(
      'SELECT id_vehiculo_activo FROM conductores WHERE id_conductor = $1',
      [idConductor],
    );
    const v = rows[0]?.id_vehiculo_activo;
    return v == null ? null : Number(v);
  }

  async setVehiculoActivo(idConductor: number, idVehiculo: number | null): Promise<void> {
    await pool.query(
      'UPDATE conductores SET id_vehiculo_activo = $2 WHERE id_conductor = $1',
      [idConductor, idVehiculo],
    );
  }
```

(+ firmas en `IConductorRepository`.)

- [ ] **Step 3: TDD del hook de autoasignación** — test primero (mocks): al `registrarVehiculo` exitoso, SI el creador tiene fila en `conductores` (usar un método existente del repo conductores para saberlo — leer la interfaz; si no hay uno directo, `getVehiculoActivo` devolviendo null vs. lanzando/row-inexistente: implementar con `SELECT` que distingue "sin fila" de "fila con NULL" — el hook solo autoasigna si HAY fila y el activo es NULL) Y `getVehiculoActivo === null` → `setVehiculoActivo(idConductor, idVehiculoNuevo)`. Si no es conductor todavía o ya tiene activo → NO tocar. 2 casos mínimo. RED → implementar en `registrarVehiculo.ts` (envuelto en try/catch no-fatal: un fallo del hook no aborta el registro del vehículo; log) → GREEN.

- [ ] **Step 4: typecheck + suite + commit** — `feat: vehiculo activo por conductor con autoasignacion al registrar (parte 3)`

---

### Task 2 (Backend): Autoasignación al ganar rol conductor

**Files:**
- Modify: `src/conductores/application/reviewDocumento.ts` (dentro del bloque `if (estadoVerificacion === 'aprobado')`, tras `addRol`)
- Modify: wiring de deps si hace falta (el módulo ya tiene `conductores` repo y `users`; necesita también leer vehículos del propietario: inyectar el repo de flotillas que liste vehículos propios — leer `listarVehiculos.ts:22-52` para reusar su query/repo)
- Test: ampliar `src/conductores/application/reviewDocumento.test.ts` (+2 casos)

**Interfaces:**
- Consumes: `setVehiculoActivo`/`getVehiculoActivo` (Task 1); el repo de vehículos de flotillas (método que devuelva vehículos propios del usuario — usar el existente, NO crear query nueva si ya hay).

- [ ] **Step 1: TDD** — casos: (1) todo aprobado + tiene vehículos propios + activo NULL → `setVehiculoActivo(id, primerVehiculo)`; (2) todo aprobado + sin vehículos → no set (y no falla). El "primer" vehículo = menor `id_vehiculo` (creación más antigua) — asértalo.
- [ ] **Step 2: Implementar** — tras `addRol` y `registrarCambioEstatus`, hook no-fatal (try/catch + log): si `getVehiculoActivo === null` y hay vehículos propios → `setVehiculoActivo(idConductor, primero)`.
- [ ] **Step 3: typecheck + suite + commit** — `feat: autoasignar primer vehiculo al ganar rol conductor (parte 3)`

---

### Task 3 (Backend): Endpoints de vehículo activo + flag en la lista + OpenAPI

**Files:**
- Modify: `src/flotillas/application/listarVehiculos.ts:22-52` (agregar `activo: boolean` por vehículo comparando contra `getVehiculoActivo` del solicitante)
- Create: `src/flotillas/application/setVehiculoActivoUseCase.ts` (nombre siguiendo convención del módulo — leerla)
- Modify: `src/flotillas/infrastructure/routes/flotillasRoutes.ts` (+`PATCH /vehiculos/activo`), controller, schemas (`{ idVehiculo: z.number().int().positive() }`)
- Modify: OpenAPI del módulo (summary + schema del PATCH y el campo `activo` en la respuesta de GET /vehiculos)
- Test: `src/flotillas/application/setVehiculoActivoUseCase.test.ts` (nuevo)

**Interfaces:**
- Produces: `PATCH /api/flotillas/vehiculos/activo` (verificar prefijo real del router en server.ts — usar el path real) body `{idVehiculo}` → 204/200; valida `asignaciones.conductorAutorizado(idConductor, idVehiculo)` (cubre dueño Y asignado) y `vehiculoAprobado` NO se exige aquí (puedes seleccionar uno en revisión; aceptar viaje es quien exige aprobado). GET /vehiculos responde cada item con `activo: true|false`.

- [ ] **Step 1: TDD del use case** — casos: autorizado → set; NO autorizado → error (403-shape del módulo, mirar errores existentes tipo `NoEsTuVehiculoError`); RED→GREEN.
- [ ] **Step 2: Ruta + controller + schema + OpenAPI.** Gate: el router-wide `requireRole('conductor','propietario')` ya cubre.
- [ ] **Step 3: typecheck + suite + commit** — `feat: seleccionar vehiculo activo y flag en lista (parte 3)`

---

### Task 4 (Backend): `aceptarViaje` deriva el vehículo activo (idVehiculo opcional)

**Files:**
- Modify: `src/viajes/infrastructure/schemas.ts:21` (`idVehiculo` → `.optional()`)
- Modify: `src/viajes/infrastructure/controllers/viajesController.ts:74` y `src/viajes/application/aceptarViaje.ts:23,30-32`
- Modify: OpenAPI de viajes (aceptar: idVehiculo opcional + descripción "si se omite, se usa el vehículo activo")
- Test: ampliar el test de aceptarViaje si existe; si no, `src/viajes/application/aceptarViaje.test.ts` (nuevo, mocks) con 3 casos

**Interfaces:**
- Consumes: `getVehiculoActivo` (Task 1) — inyectar el repo conductores en los deps de viajes (leer el wiring actual de viajes; seguir su convención).

- [ ] **Step 1: TDD** — casos: (1) request CON idVehiculo → comportamiento idéntico al actual (valida existeVehiculo/conductorAutorizado/vehiculoAprobado); (2) SIN idVehiculo + activo seteado → usa el activo y valida igual; (3) SIN idVehiculo + activo NULL → error claro (mensaje: 'Selecciona un vehículo para aceptar viajes', error code del módulo). RED→GREEN.
- [ ] **Step 2: Implementar** — en el use case: `const idVehiculoFinal = idVehiculo ?? await deps.conductores.getVehiculoActivo(idConductor); if (idVehiculoFinal == null) throw ...` y el resto igual con `idVehiculoFinal`.
- [ ] **Step 3: typecheck + suite completa + commit** — `feat: aceptar viaje deriva el vehiculo activo si no se envia (parte 3)`

---

### Task 5 (App): Vehículo activo visible y seleccionable + `getMiVehiculo` determinista

**Files:**
- Modify: `lib/features/vehicle/domain/entities/vehiculo.dart` (+`final bool activo;` default false)
- Modify: `lib/features/vehicle/data/mappers/vehiculo_mapper.dart` (parsear `activo` tolerante: `json['activo'] == true`)
- Modify: `lib/features/vehicle/data/remote/vehiculos_api.dart` (+`PATCH` al endpoint de Task 3 — path exacto del backend)
- Modify: `lib/features/vehicle/data/vehicle_repository_impl.dart`: `getMiVehiculo()` → `firstWhere activo` con fallback al comportamiento actual (aprobado → first) para compat con backend viejo; +`setVehiculoActivo(int idVehiculo)`
- Modify: `lib/features/vehicle/domain/repositories/vehicle_repository.dart` (+firma)
- Modify: `lib/features/vehicle/presentation/provider/vehicle_viewmodel.dart` (+acción) y `vehicle_list_screen.dart`: badge "En uso" (texto simple con estilos existentes) en el activo; en los NO activos, acción "Usar este" (TextButton) → set + refresh. Minimalista: sin diálogos, sin iconografía nueva.
- Test: `test/vehicle/vehiculo_mapper_test.dart` (nuevo: parseo de `activo` presente/ausente)

- [ ] Steps: leer archivos → cambios → `flutter analyze` limpio → test 2/2 → commit `feat: vehiculo activo seleccionable en la app (parte 3)`.
(acceptRide NO se toca: al volver `getMiVehiculo` determinista, ya manda el idVehiculo del activo — compat total.)

---

### Task 6 (App): Tickets P2 — f1 preflight + f2+f4 dead-code + polish Switch

**Files:**
- Modify: `lib/features/splash/presentation/screens/splash_screen.dart` — f1: con sesión, hacer un `getMe()` barato (repo de profile ya existe) antes de rutear: éxito → driverHome; `UnauthorizedException` → login; otros errores → driverHome (offline no debe bloquear el arranque).
- Delete: `lib/features/documents/presentation/utils/document_route_helper.dart` (f2 — 0 callers verificado) y `lib/features/auth/presentation/screens/registration/register_license_screen.dart` + su ruta `/license` en `lib/routes/` (f4 — inalcanzable; `guardarLicencia()` del viewmodel se CONSERVA para el onboarding futuro; si el analyzer marca campos de licencia huérfanos en el viewmodel, consérvalos con un comentario `// se reusan cuando el onboarding pida licencia`).
- Modify: `driver_home_screen.dart` — polish: el Switch de `_OnlineStatusBar`/`_LandscapeBottomBar` ya está gateado por `esConductor` a nivel de rama; NO hay cambio extra si la rama cubre ambos (verificar y, si el Switch aún es alcanzable pre-carga, gatearlo — es el flash cosmético del review final).
- Test: `flutter analyze` global de los features tocados + canary 3/3.

- [ ] Steps: leer → aplicar → grep `AppRoutes.license|resolveDocumentsRoute|RegisterLicenseScreen` = 0 refs → analyze limpio → commit `chore: tickets P2 (preflight sesion, dead-code licencia/docs, polish switch) (parte 3)`.

---

### Task 7 (E2E): Verificación integral Parte 3

Receta (mismo entorno que parte2-task-7; reportar a `.superpowers/sdd/parte3-task-7-report.md`):
1. Suite + typecheck + build + migración 021 aplicada.
2. Seed propietario+conductor (patrón P2) SIN vehículo → registrar vehículo vía `POST /vehiculos` → en BD `conductores.id_vehiculo_activo` = ese vehículo (hook Task 1).
3. Registrar 2º vehículo → activo NO cambia. `GET /vehiculos` → flags `activo` correctos (uno true, uno false).
4. `PATCH vehiculos/activo` al 2º → GET refleja el cambio; PATCH a un vehículo ajeno (de otro propietario) → 4xx.
5. Aceptar viaje SIN `idVehiculo` (sembrar viaje pendiente como en P1/P2) → 200 usando el activo; con activo NULL (nuevo conductor sin vehículos) → error claro; CON idVehiculo explícito (path viejo) → sigue funcionando.
6. Flujo P2 no regresionado: aprobar docs de un propietario CON vehículos previos → gana rol conductor Y activo autoasignado (hook Task 2).
7. Auditoría app: mapper parsea `activo`; `getMiVehiculo` prefiere activo (grep del fallback); dead-code eliminado (greps en 0).
8. Cleanup por id_usuario. Fixes solo si hay regresión real.

---

## Self-review

- **Cobertura spec §3.2 adaptado:** selección activa (T1/T3), default primer vehículo en ambos hooks (T1/T2), derivación al aceptar (T4), UI (T5), tickets P2 (T6), E2E (T7). `origen` diferido a P4 — documentado en Architecture. ✔
- **Sin placeholders:** SQL y métodos de repo completos; los use cases anclan a file:line del explorador; los tests nombran sus casos exactos. Los puntos "leer primero" están marcados con qué buscar. ✔
- **Consistencia:** `getVehiculoActivo/setVehiculoActivo` (T1) es la única interfaz nueva compartida (T2/T3/T4 la consumen con esa firma exacta). El PATCH path se fija en T3 y T5 lo consume ("path exacto del backend" — el implementador de T5 lo lee del OpenAPI/rutas ya commiteadas). ✔
- **Compat:** T4 mantiene idVehiculo aceptado; T5 mantiene fallback de getMiVehiculo → app vieja y backend viejo interoperan durante la rama. ✔
