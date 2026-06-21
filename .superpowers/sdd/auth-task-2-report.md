# Auth Task 2 — Login con contraseña: Implementation Report

## Summary

Task 2 adds `POST /api/auth/login/password` as an additive login method. OTP flow untouched.

---

## Files Created

- `src/auth/application/loginPassword.ts` — use case: busca usuario por correo, llama `passwordHashPorId`, verifica con `verifyPassword`, emite tokens. Lanza `CredencialesError` en todos los casos de fallo (no enumeración).

## Files Modified

| File | Change |
|------|--------|
| `tests/auth/password.test.ts` | Added `describe('login con contraseña')` block with 4 tests |
| `src/users/domain/repositories/IUserRepository.ts` | Added `passwordHashPorId(idUsuario: number): Promise<string \| null>` |
| `src/users/infrastructure/UserPostgresRepository.ts` | Implemented `passwordHashPorId` with `SELECT password_hash FROM usuarios WHERE id_usuario = $1` |
| `src/auth/infrastructure/schemas.ts` | Added `LoginPasswordSchema` (correo + password min(1) + dispositivo?) |
| `src/auth/infrastructure/controllers/authController.ts` | Added `loginPassword` RequestHandler |
| `src/auth/infrastructure/routes/authRoutes.ts` | Added `authRoutes.post('/login/password', c.loginPassword)` |
| `src/auth/infrastructure/dependencies.ts` | Imported `loginPassword`, wired `loginPassword({ users, sessions })` |
| `src/auth/infrastructure/openapi.ts` | Imported `LoginPasswordSchema`, registered `/api/auth/login/password` path |

---

## Test Results

### File: `tests/auth/password.test.ts`

```
 Test Files  1 passed (1)
      Tests  8 passed (8)
   Start at  18:40:45
   Duration  3.88s (transform 485ms, setup 30ms, import 1.09s, tests 2.63s, environment 0ms)
```

4 tests from Task 1 (`fijar contraseña`) + 4 new tests from Task 2 (`login con contraseña`) — all green.

### Full Suite (`npm test`)

```
 Test Files  23 passed (23)
      Tests  89 passed (89)
   Start at  18:41:22
   Duration  23.46s (transform 717ms, setup 272ms, import 7.54s, tests 12.64s, environment 1ms)
```

OTP flow (`tests/auth/flow.test.ts`) and all other suites remain green.

---

## Typecheck

```
> tsc --noEmit
(no output — no errors)
```

---

## Concerns

None. Implementation is exactly as specified in the plan. No deviations, no extra code added (YAGNI respected). The non-enumeration constraint is satisfied: `CredencialesError` is thrown for correo inexistente, usuario sin contraseña, and contraseña incorrecta — all return 401 with the same message.
