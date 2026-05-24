# Backend ViajeSeguro

Backend del proyecto integrador **ViajeSeguro** (plataforma de moto-taxis para Suchiapa, Chiapas).

## Stack

- **Node.js 20+** con **TypeScript 5** (strict)
- **Express 4** + **Zod** (validacion) + **bcrypt** + **jsonwebtoken**
- **PostgreSQL 16** (RDS) con driver `pg` puro 
- **Arquitectura hexagonal** por feature (`core/`, `<feature>/{domain,application,infrastructure}`)

## Estructura del proyecto

```
BackendViajeseguro/
├── db/
│   └── migrations/
│       └── 001_users.sql         # ENUMs + catalogo_sexo + usuarios + personas
├── src/
│   ├── core/                     # Cross-cutting concerns
│   │   ├── env.ts                # validacion de env vars con Zod
│   │   ├── db.ts                 # pool pg + helper withTransaction
│   │   ├── errors.ts             # jerarquia AppError, ValidationError, etc.
│   │   ├── errorMiddleware.ts    # handler global
│   │   ├── jwt.ts                # sign/verify token
│   │   └── authMiddleware.ts     # Bearer auth + requireRole(...)
│   ├── users/                    # Feature: usuarios y autenticacion
│   │   ├── domain/
│   │   │   ├── User.ts
│   │   │   ├── Persona.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── errors.ts
│   │   ├── application/
│   │   │   ├── registerUser_UseCase.ts
│   │   │   ├── loginUser_UseCase.ts
│   │   │   └── getMe_UseCase.ts
│   │   └── infrastructure/
│   │       ├── UserPostgresRepository.ts
│   │       ├── dependencies.ts   # composition root del feature
│   │       ├── controllers/
│   │       └── routes/
│   ├── server.ts                 # builder de Express app
│   └── index.ts                  # entry: arranca server, maneja SIGINT/SIGTERM
├── Dockerfile                    # multi-stage: builder + prod-deps + runtime
├── docker-compose.yml
├── tsconfig.json
├── package.json
└── .env.example
```

## Setup local

### 1. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y rellena:

- `DB_PASSWORD`: la password del usuario `postgres` (obtenla de AWS Secrets Manager)
- `JWT_SECRET`: genera una cadena fuerte con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Cargar el schema en la BD

Conectado al EC2 (o desde local si la RDS estuviera publica):

```bash
# Crear la base de datos si aun no existe
psql -h <ENDPOINT> -U postgres -d postgres -c "CREATE DATABASE viajeseguro;"

# Aplicar la migracion
psql -h <ENDPOINT> -U postgres -d viajeseguro -f db/migrations/001_users.sql
```

La migracion es **idempotente**: puedes correrla varias veces sin romper nada.

### 3. Instalar dependencias y correr en dev

```bash
npm install
npm run dev
```

El servidor arranca en `http://localhost:3000` con watch mode (recarga al guardar).

Endpoint de salud:

```bash
curl http://localhost:3000/health
# -> { "status": "ok", "env": "development" }
```

## Endpoints disponibles

| Metodo | Ruta                    | Auth | Descripcion                         |
|--------|-------------------------|------|-------------------------------------|
| GET    | `/health`               | -    | Health check                        |
| POST   | `/api/auth/register`    | -    | Registro de usuario + persona (1 txn) |
| POST   | `/api/auth/login`       | -    | Login, devuelve `{ user, token }`   |
| GET    | `/api/users/me`         | JWT  | Perfil del usuario autenticado      |

### Ejemplo: registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombreUsuario": "edu",
    "password": "supersegura12",
    "rol": "pasajero",
    "nombre": "Eduardo",
    "apellidoPaterno": "Chavez",
    "apellidoMaterno": "Diaz",
    "correoElectronico": "edu@example.com",
    "telefono": "9611234567"
  }'
```

### Ejemplo: login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "nombreUsuario": "edu", "password": "supersegura12" }'
```

### Ejemplo: perfil

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Build y despliegue

### Build local

```bash
npm run build      # genera dist/
npm start          # corre el dist/ con node
```

### Typecheck (sin emitir)

```bash
npm run typecheck
```

### Docker

```bash
docker compose build
docker compose up -d
docker compose logs -f api
```

## Convenciones

- **BD**: snake_case (`id_usuario`, `nombre_usuario`).
- **TypeScript**: camelCase (`idUsuario`, `nombreUsuario`).
- El mapeo BD <-> objetos vive **solo** en los repositories (`infrastructure/`).
- Los casos de uso (`application/`) **no** conocen la BD; reciben repositorios por inyeccion.
- Las entidades de `domain/` no dependen de nada externo.
- Imports relativos con `.js` al final (requerido por ESM + NodeNext).

## Proximas features

- [ ] CRUD de conductores
- [ ] CRUD de propietarios y vehiculos
- [ ] CRUD de direcciones (geografia INEGI)
- [ ] CRUD de servicios (viajes y envios)
- [ ] Evaluaciones bidireccionales
- [ ] Rastreo en tiempo real (WebSocket)
