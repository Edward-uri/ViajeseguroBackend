# Reporte de cierre hallazgo I-1 — Unificación contrato de error de credenciales

## Archivos modificados

### 1. `src/auth/domain/errors.ts`
- Se agregó `AppError` al import desde `../../core/errors.js`.
- `CredencialesError` cambió de extender `UnauthorizedError` (que forzaba `code: 'UNAUTHORIZED'` y el mensaje `'No existe una cuenta con ese identificador'`) a extender `AppError` directamente, emitiendo `status: 401`, `code: 'CREDENCIALES'`, `message: 'Correo o contraseña inválidos'`.
- El resto de las clases del archivo no se tocaron.

### 2. `tests/auth/password.test.ts`
- En los 3 casos de fallo de `POST /api/auth/login/password`:
  - `'contraseña incorrecta → 401'`
  - `'correo inexistente → 401 (no enumeración)'`
  - `'usuario sin contraseña → 401'`
- Se captura la respuesta en `res` y se agrega `expect(res.body.error.code).toBe('CREDENCIALES')`.
- No se cambió ninguna otra lógica de test.

## Tests existentes que requirieron actualización

**Ninguno.** Se buscó en toda la carpeta `tests/` por referencias a `'UNAUTHORIZED'`, `'No existe una cuenta'`, `CredencialesError` y `'CREDENCIALES'`. Ningún test previo asentaba el código o mensaje antiguo de `CredencialesError`. El cambio es transparente para los tests de OTP existentes en `tests/auth/otp.test.ts` y `tests/auth/flow.test.ts`, ya que éstos no asertan el `code` del error de credenciales.

## Salida de la suite completa

```
 RUN  v4.1.9

 Test Files  23 passed (23)
      Tests  89 passed (89)
   Start at  18:52:36
   Duration  25.72s (transform 651ms, setup 267ms, import 7.28s, tests 15.22s, environment 1ms)
```

## Salida de typecheck

```
> viajeseguro-backend@0.1.0 typecheck
> tsc --noEmit

(sin errores)
```

## Resultado

DONE — suite 23/23 archivos, 89/89 tests en verde; typecheck limpio.
