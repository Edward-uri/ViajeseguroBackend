# Progreso — Plan B Tiempo Real (Socket.IO + FCM)

Plan: docs/superpowers/plans/2026-06-20-viajes-tiempo-real.md
Restricción dura: NINGÚN comando git (no add/commit/push). El usuario commitea.
Ejecución: subagent-driven (un implementador por task).

## Estado de tasks
- Task 1: completo (deps instaladas, env SOCKET_CORS_ORIGIN + FCM_SERVICE_ACCOUNT, typecheck limpio)
- Task 2: completo (puerto IEventoViajeNotifier nuevas firmas, 3 casos de uso + mock, flow.test.ts 7/7)
- Task 3: completo (src/realtime/rooms.ts + test, 1/1)
- Task 4: completo (SocketEventoViajeNotifier + test, 6/6, typecheck limpio)
- Task 5: completo (guardarUbicacion repo + registrarUbicacion use case + test, 4/4)
- Task 6: completo (FCM: tokensActivosDeUsuario, Fcm/Log/pickPushSender, test 4/4). NOTA: firebase-admin v14 -> imports nombrados 'firebase-admin/app' y 'firebase-admin/messaging' (no default/namespace). Comportamiento idéntico al plan.
- Task 7: completo (dependencies.ts: socketNotifier + pickPushSender + registrarUbicacion; mocks borrados; flow.test.ts 7/7)
- Task 8: completo (socketServer.ts auth+joins+eventos entrantes; socketAuth.test.ts 3/3)
- Task 9: completo (index.ts bootstrap http+io+attach+shutdown; realtime.test.ts E2E 1/1; suite completa 19 archivos / 64 tests verde; typecheck limpio)
- Final review: completo (opus). Sin Critical. Important 1-3 + nit 5 -> fix subagent en background. Important 4 (fuga cross-municipio) documentado como deuda en ADR-013 (decisión del usuario).
- Fix review: COMPLETO. Important 1-3 + nit 5 aplicados (shutdown async, cleanup tests, guards, getApps).
- Important 4: CERRADO. conductor:online deriva municipio del server (conductores.id_municipio vía conductorUseCases.municipioOperativo), valida vs cliente, ack {ok}. + zod en payloads entrantes (src/realtime/schemas.ts) + eventos tipados (src/realtime/events.ts). Nuevos: events.ts, schemas.ts, conductores/application/municipioOperativo.ts. Test negativo agregado.
- Estado final: typecheck limpio, suite 19 archivos / 66 tests verde. Todo en working tree (sin commitear; el usuario commitea).

# Plan C — Flujo del conductor (subagent-driven)
Plan: docs/superpowers/plans/2026-06-20-viajes-conductor.md
- Task 1 (disponibilidad: migración 007 + REST): COMPLETO. Review aplicado (rango geográfico zod + asserts null). 5/5 tests, typecheck limpio.
- Task 2 (viajes conductor: pendientes + asignados): COMPLETO. Review aplicado (test 403 /asignados). 
- Cierre Plan C: suite 22 archivos / 81 tests verde, typecheck limpio. Todo en working tree (sin commitear).
- Deuda preexistente señalada (Plan A): ViajeSchema en openapi omite las fechas (fechaSolicitud, etc.) — afecta todos los endpoints de viajes.

# Auth con contraseña (subagent-driven, sin commits)
Plan: docs/superpowers/plans/2026-06-20-auth-password.md
- Task 1 (migración 008 + tienePassword + POST /api/auth/password): COMPLETO. Review limpio (Spec ✅, calidad Aprobada). 4/4 tests verde, typecheck limpio. Sin commitear (working tree).
  - Minor para el review final: M-2 los tests de política usan 'abc' (viola 3 reglas a la vez); podría cubrirse cada regla por separado.
- Task 2 (POST /api/auth/login/password + passwordHashPorId): COMPLETO. Review limpio (Spec ✅, calidad Aprobada). 8/8 en el archivo, suite completa 89/89, typecheck limpio. Sin commitear (working tree).
  - Minor para el review final: el tipo inline de `dispositivo` en loginPassword es `string | null | undefined` vs `string | undefined` del schema (cosmético, sin bug).
- Review final (opus): sin Critical. Important I-1 (code del error de credenciales): CERRADO con opción A — CredencialesError ahora emite `code: 'CREDENCIALES'` (extiende AppError), mensaje 'Correo o contraseña inválidos', unificado OTP+password. Tests refuerzan `error.code`. Suite 89/89, typecheck limpio.
- Estado: feature COMPLETA, en working tree (sin commitear; el usuario hace push+deploy). Requiere migración 008 en prod.

# Admin de Tarifas (subagent-driven, sin commits)
Plan: docs/superpowers/plans/2026-06-20-admin-tarifas-zonas.md
- Task 1 (GET lista + POST crear zona+tarifa en transacción): COMPLETO. Review limpio (Spec ✅, calidad Aprobada). 8/8 tests, typecheck limpio. Sin migración nueva (reusa 006). Working tree.
  - Minor (no bloqueante): #1 el 404 de municipio inexistente depende de la FK zonas.id_municipio (existe en 006, test pasa); #2 ActualizarZonaSchema se agregó en Task 1 por pedido del plan (se consume en Task 2).
- Task 2 (PATCH editar + DELETE soft-delete): COMPLETO. Review: Spec ✅. 16/16 en el archivo, suite completa 105/105, typecheck limpio. Working tree.
  - Hallazgos adjudicados (no bloqueantes): I-1 mapRow(rows[0]!) no alcanzable por la invariante zona+tarifa (guardarlo=YAGNI); I-2 desactivar con pool.query es un solo UPDATE atómico, plan-aligned, no defecto; I-3 re-lectura sin re-filtrar municipio es segura por el FOR UPDATE previo. Pasados al review final para triage.
- Review final (opus): LISTO PARA MERGE. Sin Critical/Important. Concordó con I-1/I-2/I-3. Confirmó que uq_tarifa_zona_vigente no se viola (update en sitio).
  - N-1 (decisión de producto, no bloqueante): no se puede poner el centro (lat/lng) de una zona a NULL una vez seteado. Recomendado aceptar para MVP (cercanía es futuro). Fix de 1 línea si se quisiera (schema nullable + propagar null).
  - Minors: N-3 zona sin centro es invisible a zonaMasCercana (coherente); N-4 mensaje de error con comillas vacías (cosmético, no alcanzable); N-5 triple app.use('/api/admin') es deuda preexistente.
- Estado: feature COMPLETA, en working tree (sin commitear). Sin migración nueva. Suite 105/105.
