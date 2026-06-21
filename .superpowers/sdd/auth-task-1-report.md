# Auth Task 1 Report — Modelo de contraseña + fijar contraseña

Date: 2026-06-20

## Files Created

- `db/migrations/008_password.sql` — ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
- `src/auth/domain/password.ts` — hashPassword / verifyPassword con bcryptjs
- `src/auth/application/setPassword.ts` — caso de uso fijar/cambiar contraseña
- `tests/auth/password.test.ts` — 4 tests de la suite "fijar contraseña"

## Files Modified

- `src/users/domain/User.ts` — tienePassword en PublicUser, User constructor (default false), toPublicJSON(), UserBuilder (_tienePassword, setter, build())
- `src/users/domain/repositories/IUserRepository.ts` — método setPasswordHash(idUsuario, passwordHash)
- `src/users/infrastructure/UserPostgresRepository.ts` — password_hash en UsuarioRow, .tienePassword(row.password_hash != null) en mapUserRow, método setPasswordHash
- `src/docs/openapiRegistry.ts` — tienePassword: z.boolean() en PublicUserSchema
- `src/auth/infrastructure/schemas.ts` — passwordPolitica + SetPasswordSchema al final
- `src/auth/infrastructure/controllers/authController.ts` — import UnauthorizedError, setPasswordController
- `src/auth/infrastructure/routes/authRoutes.ts` — import authMiddleware, ruta POST /password con authMiddleware
- `src/auth/infrastructure/dependencies.ts` — import setPassword, authUseCases.setPassword wired
- `src/auth/infrastructure/openapi.ts` — import SetPasswordSchema, OkSchema, path POST /api/auth/password

## Test Output

```
 RUN  v4.1.9

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  18:34:18
   Duration  2.62s (transform 493ms, setup 30ms, import 1.12s, tests 1.33s, environment 0ms)
```

Tests: 4 passed / 0 failed

## Typecheck Output

```
> viajeseguro-backend@0.1.0 typecheck
> tsc --noEmit
```

No errors.

## Migration Applied

```
+ aplicando 008_password.sql
migraciones OK
```

## Concerns

None. All steps completed as specified by the plan. OTP flow untouched. Hash never exposed in User/PublicUser (only tienePassword boolean). Password policy enforced only on set, not on verify.
