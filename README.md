# ViajeSeguro Backend

Backend REST para ViajeSeguro, una plataforma de movilidad para conectar pasajeros y conductores en Suchiapa, Chiapas.

## Responsabilidades

Este servicio centraliza la lógica de servidor para:

- registro y autenticación de usuarios;
- gestión del perfil autenticado;
- autorización por roles;
- persistencia de usuarios y personas;
- validación de entradas;
- manejo consistente de errores;
- conexión transaccional con PostgreSQL.

## Stack

- Node.js 20+
- TypeScript 5 en modo strict
- Express 4
- Zod
- PostgreSQL 16
- `pg`
- bcrypt
- JSON Web Tokens
- Docker y Docker Compose
- Vitest

## Arquitectura

El proyecto sigue una arquitectura hexagonal organizada por funcionalidades:

```
src/
├── core/                         # Configuración y preocupaciones transversales
│   ├── env.ts                    # Validación de variables de entorno
│   ├── db.ts                     # Pool de PostgreSQL y transacciones
│   ├── errors.ts                 # Errores de aplicación
│   ├── errorMiddleware.ts        # Manejo global de errores
│   ├── jwt.ts                    # Emisión y verificación de tokens
│   └── authMiddleware.ts         # Autenticación y roles
├── users/
│   ├── domain/                   # Entidades, contratos y errores
│   ├── application/              # Casos de uso
│   └── infrastructure/           # PostgreSQL, controladores y rutas
├── server.ts                     # Construcción de la aplicación Express
└── index.ts                      # Punto de entrada
```

La lógica de negocio permanece aislada de Express, PostgreSQL y los detalles de infraestructura. Esto facilita probar los casos de uso y cambiar adaptadores sin afectar el dominio.

## API principal

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| GET | `/health` | No | Verifica el estado del servicio |
| POST | `/api/auth/register` | No | Registra un usuario y su información personal |
| POST | `/api/auth/login` | No | Inicia sesión y devuelve un JWT |
| GET | `/api/users/me` | JWT | Consulta el perfil autenticado |

## Ejecución local

### Requisitos

- Node.js 20+
- PostgreSQL 16 o Docker
- npm o pnpm

### Instalación

```bash
git clone https://github.com/Edward-uri/ViajeseguroBackend.git
cd ViajeseguroBackend
npm install
cp .env.example .env
```

Completa las variables de entorno del archivo `.env`. Nunca publiques contraseñas, secretos JWT, endpoints privados ni credenciales.

### Base de datos

Aplica la migración incluida en:

```
db/migrations/001_users.sql
```

También puedes utilizar el entorno definido en `docker-compose.yml` cuando corresponda.

### Desarrollo

```bash
npm run dev
```

El servicio expone el endpoint de salud en:

```
http://localhost:3000/health
```

### Pruebas y calidad

Consulta los scripts disponibles en `package.json` para ejecutar las pruebas, el lint y el typecheck.

## Relación con ViajeSeguro

- [Frontend web](https://github.com/Edward-uri/VIAJESEGURO)
- [Aplicación móvil](https://github.com/Edward-uri/ViajeseguroApp)
- [Aplicación del conductor](https://github.com/Edward-uri/viajeSeguroConductor)
- [Servicio de cálculo de rutas](https://github.com/Edward-uri/CalcularRutaServices)

## Estado

Proyecto académico/integrador en evolución. El backend está diseñado para crecer por funcionalidades sin mezclar dominio, aplicación e infraestructura.

## Autor

Eduardo Uriel Chavez Diaz — [@Edward-uri](https://github.com/Edward-uri)
