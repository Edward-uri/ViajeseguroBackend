# Diseño: Identidad multi-rol, propietarios-conductores y bolsa de trabajo

- **Fecha:** 2026-07-07
- **Alcance:** `ViajeseguroBackend`, `viajeSeguroConductor` (app conductor), `ViajeseguroApp` (app pasajero), `ViajeseguroPanelWeb` (admin).
- **Estado:** propuesta para revisión (paso previo al plan de implementación).

## 1. Objetivo y cambio de negocio

Hoy cada cuenta tiene **un solo `rol`** (`usuarios.rol`, enum). El nuevo modelo de negocio:

1. Quien se registra en la **app conductor** nace con rol **propietario** (y **pasajero**, para poder usar la app de pasajero con la misma cuenta).
2. El propietario **puede o no** registrar una mototaxi.
3. Un propietario puede tener **1 o más vehículos** y **manejar el que tenga asignado**; por defecto, el **primero** que agregue.
4. Un propietario **sin vehículo** (o que busca trabajo) entra a la **bolsa de trabajo** para conseguir conducir el vehículo de otro propietario.
5. La **misma cuenta** inicia sesión en la **app pasajero** para pedir viajes.

## 2. Decisiones tomadas

| # | Decisión | Elección |
|---|----------|----------|
| D1 | Representación de varios roles por cuenta | Tabla **`usuario_roles`** (M:N). El JWT lleva `roles[]`. |
| D2 | Alcance de la bolsa de trabajo | **Bidireccional con postulaciones** (vacantes + postulaciones). |
| D3 | Onboarding de conductor | **Progresivo**: el registro base no pide licencia; el rol `conductor` se otorga al aprobar licencia + documentos. |
| D4 | `usuarios.rol` | **Eliminar**; toda la autorización pasa a `roles[]`. Migración en **2 fases** (ver §7). |

## 3. Modelo de datos

Convenciones existentes: snake_case, `id_x BIGINT GENERATED ALWAYS AS IDENTITY`, FKs a `usuarios(id_usuario)`, trigger `set_updated_at()`. El enum `rol_usuario('pasajero','conductor','propietario','admin')` ya existe y se reutiliza.

### 3.1 Roles (D1/D4)

```sql
CREATE TABLE usuario_roles (
  id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  rol        rol_usuario NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, rol)
);
CREATE INDEX idx_usuario_roles_rol ON usuario_roles(rol);
```

- **Fuente de verdad** de autorización.
- `usuarios.rol` se elimina en la fase 2 de la migración.

### 3.2 Asignación conductor→vehículo (requisito 3 y 4)

```sql
CREATE TYPE origen_asignacion AS ENUM ('propia','bolsa');

CREATE TABLE asignaciones_vehiculo (
  id_asignacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vehiculo   BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo)   ON DELETE CASCADE,
  id_conductor  BIGINT NOT NULL REFERENCES conductores(id_conductor) ON DELETE CASCADE,
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  origen        origen_asignacion NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizada_en TIMESTAMPTZ
);
-- A lo sumo UN vehículo activo por conductor (para "ponerse en línea"):
CREATE UNIQUE INDEX uq_conductor_activo ON asignaciones_vehiculo(id_conductor) WHERE activa;
CREATE INDEX idx_asignaciones_vehiculo ON asignaciones_vehiculo(id_vehiculo);
```

- Propietario que maneja su propio vehículo → asignación `origen='propia'`.
- **Default**: al registrar su **primer** vehículo (si ya es conductor), se autoasigna `activa=TRUE`.
- Al ir en línea / `toggleAvailability`, el backend usa el vehículo **activo** del conductor (ya no lo manda el cliente a ciegas).

### 3.3 Bolsa de trabajo (D2)

```sql
CREATE TYPE estado_vacante     AS ENUM ('abierta','cerrada');
CREATE TYPE estado_postulacion AS ENUM ('pendiente','aceptada','rechazada','retirada');

CREATE TABLE vacantes (
  id_vacante     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propietario BIGINT NOT NULL REFERENCES propietarios(id_propietario) ON DELETE CASCADE,
  id_vehiculo    BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo)       ON DELETE CASCADE,
  id_municipio   BIGINT NOT NULL REFERENCES municipios(id_municipio),
  condiciones    TEXT,
  estado         estado_vacante NOT NULL DEFAULT 'abierta',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vacantes_municipio ON vacantes(id_municipio, estado);

CREATE TABLE postulaciones (
  id_postulacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_vacante     BIGINT NOT NULL REFERENCES vacantes(id_vacante)         ON DELETE CASCADE,
  id_conductor   BIGINT NOT NULL REFERENCES conductores(id_conductor)    ON DELETE CASCADE,
  estado         estado_postulacion NOT NULL DEFAULT 'pendiente',
  mensaje        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_vacante, id_conductor)
);
CREATE INDEX idx_postulaciones_conductor ON postulaciones(id_conductor, estado);
```

- Al **aceptar** una postulación: se crea `asignaciones_vehiculo(origen='bolsa')`, se cierra la vacante y se rechazan las demás postulaciones de esa vacante (en una transacción).

## 4. Autorización (JWT + middleware)

- `AccessPayload` (estado final): `{ sub, roles: Rol[], type: 'access' }` (antes `rol: Rol`). Durante la fase 1 de migración lleva **también** `rol` derivado por compatibilidad (ver §7).
- `signAccessToken` recibe `roles` derivados de `usuario_roles` en login/refresh.
- `requireRole(...permitidos)` pasa si `req.user.roles.some(r => permitidos.includes(r))`.
- Los 7 gates `requireRole('conductor')` de `viajes` no cambian de forma; ahora pasan quienes tengan `conductor` en su set.
- Solicitar viaje (lado pasajero): confirmar que solo exige `requireAuth` (no un rol único). Si exige, relajar a "cualquiera con `pasajero`".

## 5. Cambios por componente

### 5.1 Backend
- **Migraciones**: `usuario_roles`, `asignaciones_vehiculo`, `vacantes`, `postulaciones`, enums nuevos; y (fase 2) `DROP COLUMN usuarios.rol`.
- **auth**: `verifyRegistration`/`completeRegistration` asignan un **conjunto** de roles. Registro desde app conductor → `{propietario, pasajero}` + fila en `propietarios`.
- **jwt/sessionTokens**: `roles[]` en vez de `rol`.
- **flotillas**: endpoints de vehículos + asignación (activar/cambiar vehículo, autoasignar primero).
- **conductores**: al aprobarse licencia + docs → agregar rol `conductor` (`INSERT INTO usuario_roles`).
- **bolsa (nuevo módulo)**: CRUD de vacantes, postular, aceptar/rechazar/retirar; notificaciones vía `realtime` (socket.io) + push Firebase.
- **viajes**: `toggleAvailability`/ir en línea usa el vehículo **activo**.

### 5.2 App conductor (`viajeSeguroConductor`)
- `User.rol: String` → `roles: List<String>` (+ helpers `esPropietario`, `esConductor`, `esPasajero`).
- Registro: sale la pantalla de licencia del flujo base; nace propietario.
- Onboarding conductor progresivo ("Quiero manejar" → licencia + docs).
- Gestión de vehículos: alta, lista, marcar **vehículo activo**.
- Vistas nuevas de bolsa: *Publicar vacante* / *Postulaciones recibidas* (dueño), *Bolsa de trabajo · Postular* (conductor).

### 5.3 App pasajero (`ViajeseguroApp`)
- Login acepta cualquier cuenta con `pasajero` en `roles[]`; quitar gate cliente por `rol=='pasajero'`.
- Adaptar el parseo del usuario/JWT a `roles[]`.

### 5.4 Panel admin (`ViajeseguroPanelWeb`)
- Adaptar lectura de `rol` → `roles[]` donde aplique (listados, filtros, permisos).

## 6. Flujos clave

1. **Registro (app conductor):** OTP → completar → crea usuario + `propietarios` + roles `{propietario,pasajero}`. Sin licencia.
2. **Quiero manejar:** sube licencia + docs → aprobación → rol `conductor`. Si ya tiene ≥1 vehículo propio y ninguno activo, se autoasigna el primero.
3. **Registrar vehículo:** alta en `vehiculos`; primer vehículo del conductor → asignación `propia` activa.
4. **Bolsa (dueño):** publica vacante(vehículo) → recibe postulaciones → acepta una → asignación `bolsa` + cierre.
5. **Bolsa (conductor sin vehículo):** filtra vacantes por municipio → postula → al ser aceptado, obtiene vehículo activo y puede ponerse en línea.
6. **Pasajero:** misma cuenta entra a la app pasajero y pide viajes.

## 7. Migración y despliegue (2 fases, sin romper apps instaladas)

**Fase 1 (aditiva):**
- Crear `usuario_roles` y **backfill**: por cada usuario, insertar su `rol` actual; además insertar `pasajero` para todo usuario no-admin.
- Crear tablas de asignación y bolsa.
- JWT emite **`roles[]` y además `rol`** (rol principal derivado) para compatibilidad con apps ya desplegadas.
- Backend lee `roles[]`; clientes nuevos leen `roles[]`.

**Fase 2 (limpieza, tras actualizar los 3 clientes):**
- Quitar `rol` del JWT.
- `ALTER TABLE usuarios DROP COLUMN rol`.
- Eliminar código que aún lea `usuarios.rol`.

Orden de despliegue: **backend fase 1 → apps/panel → backend fase 2**.

## 8. Secuencia de implementación (por partes)

1. **Roles**: `usuario_roles` + backfill + JWT `roles[]` + `requireRole` intersección (fase 1).
2. **Registro**: propietario+pasajero, licencia/vehículo opcional, onboarding conductor progresivo.
3. **Asignación** conductor→vehículo (default primero, vehículo activo) + usar activo al ir en línea.
4. **Bolsa de trabajo** (vacantes/postulaciones/aceptar→asignación).
5. **App pasajero**: login cruzado. **Panel admin**: `roles[]`.
6. **Fase 2** de la migración (drop `rol`).

## 9. Fuera de alcance (YAGNI)

- Perfil público de "conductor disponible" / invitaciones directas del dueño (v1 = solo vacantes+postulaciones).
- Calificaciones entre propietario y conductor.
- Multi-asignación simultánea (un conductor = un vehículo activo a la vez).
- Pagos/comisiones de la relación propietario-conductor.

## 10. A validar durante implementación

- Endpoint de solicitar viaje: ¿solo `requireAuth`? (confirmar que no exige rol único).
- Regla exacta de backfill de `pasajero` (¿todos los no-admin, incluidos conductores existentes?).
- ¿Un conductor puede tener vacantes/asignaciones en varios municipios? (v1: filtro por municipio del vehículo).
- Estado de licencia vencida → ¿revoca rol `conductor` o solo bloquea ir en línea?
