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

# Contraseña opcional en el registro (subagent-driven, sin commits)
Plan: docs/superpowers/plans/2026-06-20-password-en-registro.md
- Task única (password? en register/complete, hash atómico en createUserWithPersona, reusa passwordPolitica+hashPassword): COMPLETO. Review limpio (Spec ✅, calidad Aprobada). 11/11 en password.test.ts, suite completa 108/108, typecheck limpio. Sin migración (reusa password_hash de 008). Working tree.
  - Minors (no bloqueantes): password?: string|null vs string del schema (sigue la convención del resto de CompleteRegistrationInput); el test "con password" asienta accessToken pero no refreshToken.

# Batch endpoints App (conductor + flotilla) — 2026-06-22 (subagent-driven, sin commits)
Specs: docs/superpowers/specs/2026-06-22-endpoints-conductor-flotilla-design.md (+ 2026-06-22-bolsa-de-trabajo-design.md = DIFERIDO, solo spec)
Planes: rechazar-viajes (10 tasks) · asignacion-y-aceptar (4) · editar-perfil (3) · ganancias (4)
Restricción dura: NINGÚN comando git (no add/commit/push). Ejecución por feature (implementador + revisor). Secuencial: comparten la BD de test viajeseguro_test (los beforeEach truncan tablas) → no correr tests en paralelo.
Migraciones nuevas: 009_viaje_rechazos, 010_asignaciones_conductor_vehiculo, 011_conductor_sesiones.
- Rechazar viajes: COMPLETO. Implementador DONE (sin desviaciones). Revisor: Spec ✅, calidad Aprobada, sin Critical/Important (solo menores no-bloqueantes). 5/5 en rechazar.test.ts, suite 25 archivos/113 tests verde, typecheck limpio. Working tree. Migración 009 aplicada en test DB.
- Asignación + aceptar: COMPLETO. Implementador DONE (sin tocar tests existentes; wiring viajes→flotillas, sin ciclo). Revisor (opus): Spec ✅ (7/7 checks), calidad Aprobada, sin Critical/Important. 19 tests nuevos (6 repo asignación + 8 HTTP asignación + 5 aceptar autorización), suite 28 archivos/132 tests verde, typecheck limpio. Migración 010 aplicada. Working tree.
  - Minores para review final: (1) AsignacionPostgresRepository.asignar usa UPDATE-then-INSERT no transaccional en pool auto-commit; bajo concurrencia del mismo par revocado ambos podrían caer al INSERT pero el ON CONFLICT (partial unique) evita duplicado → no-op inocuo. Seguro para MVP. (2) asignacion.test.ts idempotencia HTTP no asienta el row count crudo (sí cubierto por el repo test).
- Editar perfil: COMPLETO. Implementador DONE (único new User() en UserBuilder.build; mapUserRow+completeRegistration heredan default false; sin tocar tests existentes). Revisor: Spec ✅ (7/7), calidad Aprobada, sin Critical/Important. 7/7 en editarPerfil.test.ts, suite 29 archivos/139 tests verde, typecheck limpio. Sin migración (reusa personas/usuarios/vehiculos). Working tree.
  - Minor para review final: schemas.ts idSexo/fechaNacimiento son .optional() sin .nullable() mientras la interfaz de actualizarPerfil acepta T|null (no se puede limpiar a null vía COALESCE; cosmético, sin bug). Documentado como límite MVP.
- Ganancias: COMPLETO. Implementador DONE (TZ America/Mexico_City con Intl longOffset DST-aware; horasEnLinea con GREATEST(...,0)+COALESCE(fin,now()); abrir idempotente partial-unique; setDisponibilidad preserva comportamiento). Revisor (opus): Spec ✅, calidad Aprobada, sin Critical/Important; confirmó explícitamente que el clamp negativo y la dirección de AT TIME ZONE están correctos. Fix aplicado: dedupe TZ (import desde horario.ts) + test de sesión fuera de rango. ganancias.test.ts 10/10, typecheck limpio. Migración 011 aplicada. Working tree.
  - Minores para review final: (1) hook de sesión en setDisponibilidad no transaccional con el upsert (MVP-ok); (2) hastaTs exclusivo en horasEnLinea vs ::date<=hasta inclusive en ganancias (ambos correctos, asimetría latente).

## Estado del batch: 4/4 features COMPLETAS (working tree, sin commitear).
Suite completa verde: 30 archivos / 149 tests. Typecheck limpio.
Review final del branch (opus): integración LIMPIA (sin clobbering en archivos compartidos viajes/dependencies.ts etc.), migraciones 009/010/011 contiguas e idempotentes, esPropietario y la autorización de aceptar usan la MISMA definición de "puede manejar" (single-sourced), sin regresiones (listarPendientesPorMunicipio sin callers stale). Los 4 menores = ACCEPTABLE-FOR-MVP. Veredicto: READY TO MERGE.
Pendiente del usuario: aplicar migraciones 009/010/011 en dev/prod; commit+push+redeploy; avisar a la App que aceptar ahora exige idVehiculo. Bolsa de trabajo = spec escrito, DIFERIDO. Método de cobro = diferido.

# Estimar viaje con geometría (Opción B) — 2026-06-22 (subagent-driven, sin commits)
Spec: docs/superpowers/specs/2026-06-22-estimar-viaje-geometria-design.md · Plan: docs/superpowers/plans/2026-06-22-estimar-viaje-geometria.md (5 tasks)
Alcance: POST /api/viajes/estimar (ruta GeoJSON siguiendo carreteras vía OSRM overview=full) + extender IRouteEstimator con geometria + fix 500 del :id (IdParamSchema en controllers de viaje) + crearViaje guarda distanciaKm. Sin migración.
- Estimar viaje geometría: COMPLETO. NOTA: la Task 1 (RutaGeoJSON + IRouteEstimator.geometria + ambos estimadores + sus tests) YA estaba en el working tree al inicio de la sesión (los 4 archivos M del git status inicial) — el implementador construyó el resto encima. Revisor: Spec ✅ (6/6), calidad Aprobada, sin Critical/Important (2 menores triviales). estimar 3/3 + idParam 2/2 + osrm 5/5 + haversine 1/1; suite 32 archivos/154 tests verde; typecheck limpio. Sin migración. Working tree.
  - Incluye fix del 500: los 7 controllers de viaje con :id ahora usan IdParamSchema.parse (:id no numérico → 400, antes 500). + crearViaje guarda distanciaKm numérico.

# Invitaciones de admins — 2026-06-22 (subagent-driven, sin commits)
Spec: docs/superpowers/specs/2026-06-22-invitaciones-admin-design.md (migración 012; POST /api/admin/invitaciones + GET + DELETE; POST /api/auth/invitaciones/aceptar; IInvitationSender Brevo+Mock; createAdmin sin persona; env ADMIN_PANEL_URL/BREVO_INVITE_TEMPLATE_ID/INVITE_TTL_DAYS).
- Invitaciones admin: COMPLETO. Plan 5 tasks. T1-T4 implementadas (un agente murió por error de conexión a mitad de T5 pero T1-T4 quedaron OK: typecheck limpio, migración 012 aplicada, repo+sender tests verdes). Un 2do agente completó T5 (test E2E invitaciones.test.ts 13/13, sin bugs de producción). Revisor (opus): Spec ✅, calidad/seguridad Aprobada, sin Critical/Important — confirmó token alta-entropía solo sha256 guardado, single-use, transacción atómica create-admin+marcar-aceptada, sin escalada de privilegios. Hueco: faltaba registro OpenAPI de los 4 endpoints → FIX aplicado (+ assert de password débil tensado). Suite final 35 archivos/175 tests verde, typecheck limpio. Migración 012. Working tree.
  - CONTRATO CAMBIADO (avisar a App): CorreoYaRegistradoError ahora emite code 'CORREO_YA_REGISTRADO' (antes 'CONFLICT') — afecta también POST /api/auth/register/start (mismo 409, distinto error.code). Spec lo pedía; clientes que ramifiquen por status no se afectan.
  - Pendiente del usuario: crear plantilla Brevo (BREVO_INVITE_TEMPLATE_ID, params ACCEPT_URL/EXPIRY_DAYS/INVITER_EMAIL) + setear ADMIN_PANEL_URL; panel: página /aceptar-invitacion?token= + UI invitar/listar/revocar; aplicar migración 012 en dev/prod.

# Cifrado y privacidad — Fases 1 y 2 (motor puro) — 2026-06-25 (subagent en background, sin commits)
Spec: docs/superpowers/specs/2026-06-25-cifrado-privacidad-design.md · Clasificación: docs/seguridad/clasificacion-datos-privacidad.md · Plan: docs/superpowers/plans/2026-06-25-cifrado-privacidad-fases-1-2.md (4 tasks)
Alcance: motor de cifrado PURO (sin BD ni repos). ICipher + AesGcmCipher (AES-256-GCM texto/bytes + blind index HMAC) + buildCipher/env CIPHER_KEY+CIPHER_INDEX_KEY (fail-closed) + sensitiveFields + CipherPipeline (filtros cifrar/blind-index/descifrar/anonimizar) + CipherCodec.
- Fases 1-2: DONE (un subagente sonnet en background ejecutó las 4 tasks). 4 archivos de test / 23 tests verdes, typecheck limpio, sin desviaciones del plan. Working tree (sin commitear).
  - Archivos: src/core/crypto/{ICipher,AesGcmCipher,cipher,sensitiveFields,CipherPipeline,CipherCodec}.ts + tests/core/crypto/*.test.ts; modificados src/core/errors.ts (CipherConfigError/CipherError) y src/core/env.ts (CIPHER_KEY/CIPHER_INDEX_KEY opcionales).
  - Realineación de capas HECHA (feedback del usuario "no perder arquitectura"): puerto ICipher + lógica pura (CipherPipeline/CipherCodec/sensitiveFields) en src/core/crypto/; adapter AesGcmCipher + wiring cipher.ts movidos a src/infrastructure/crypto/ (precedente IDocumentStorage). Tests movidos a tests/infrastructure/crypto/. Verde: infra 13 + core 10 = 23 tests, typecheck limpio. NOTA: vitest falla con "reading 'config'" si se le pasan 2 rutas posicionales a la vez → correr una carpeta por invocación. Falta review de tarea formal del cipher.
  - Fase 3+ (migración _enc/_bidx, repos por codec, login por blind index) = siguiente plan.
