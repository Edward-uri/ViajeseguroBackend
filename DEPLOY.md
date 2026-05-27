# Deploy del Backend a EC2

Pipeline: `push` a `main` --> typecheck en GitHub Actions --> SSH al EC2 --> `git pull` + `docker compose up -d --build` --> health check.

Stack en produccion:
- **Nginx** (puerto 80, expuesto al publico) hace reverse proxy a...
- **API Express** (puerto 3000, solo accesible dentro de la red de docker).
- **PostgreSQL** vive aparte en RDS.

## Setup inicial (una sola vez)

### 1. Crear repo en GitHub (privado)

```bash
# desde tu maquina local, en la raiz del backend
git init
git add .
git commit -m "Initial commit: backend hexagonal en TypeScript"
git branch -M main
git remote add origin git@github.com:<tu-usuario>/viajeseguro-backend.git
git push -u origin main
```

### 2. Generar deploy key en el EC2 (acceso read-only al repo)

```bash
ssh -i backendViaje.pem ubuntu@100.51.99.11

# en el EC2:
ssh-keygen -t ed25519 -C "deploy@ec2-viajeseguro" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Copia la salida (`ssh-ed25519 AAAA...`) y agregala en:
**GitHub repo -> Settings -> Deploy keys -> Add deploy key**
- Title: `ec2-viajeseguro`
- Key: pega la clave publica
- **NO** marques "Allow write access" (read-only es suficiente)

### 3. Configurar SSH del EC2 para usar esa key con GitHub

En el EC2:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

# Probar
ssh -T git@github.com
# Debe decir: "Hi <tu-usuario>/viajeseguro-backend! You've successfully authenticated..."
```

### 4. Clonar el repo en el EC2

```bash
cd /home/ubuntu
git clone git@github.com:<tu-usuario>/viajeseguro-backend.git
ls viajeseguro-backend/   # deberia listar tus archivos
```

### 5. Configurar Secrets en GitHub Actions

GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret.
Agrega estos secretos uno por uno:

| Nombre                  | Valor                                                       |
|-------------------------|-------------------------------------------------------------|
| `EC2_HOST`              | `100.51.99.11`                                              |
| `EC2_USER`              | `ubuntu`                                                    |
| `EC2_SSH_KEY`           | Contenido completo del archivo `backendViaje.pem` (texto)   |
| `DB_HOST`               | `viajeseguro-db.cglxtkp5zsdm.us-east-1.rds.amazonaws.com`   |
| `DB_PASSWORD`           | Password del usuario `postgres` (de Secrets Manager)        |
| `JWT_SECRET`            | Cadena aleatoria fuerte de >=48 caracteres                  |
| `AWS_REGION`            | `us-east-1`                                                 |
| `AWS_S3_BUCKET`         | Nombre del bucket S3 (`viajeseguro-uploads-prod`)           |

> **Credenciales AWS**: NO se pasan por `.env`. El EC2 tiene asociado el `LabInstanceProfile` (rol `LabRole`) y el SDK de Node descubre las credenciales automaticamente desde el metadata service (`http://169.254.169.254/...`). Las credenciales rotan solas cada hora sin que toquemos nada. Para que esto funcione dentro de Docker hay que subir el **hop limit de IMDSv2 a 2** en la instancia (EC2 -> Actions -> Instance settings -> Modify instance metadata options).

Para generar un `JWT_SECRET` fuerte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 6. Abrir puerto 80 en el Security Group del EC2

EC2 Console -> Security Groups -> `launch-wizard-1` -> Reglas de entrada -> Agregar:
- Tipo: HTTP
- Puerto: 80
- Origen: 0.0.0.0/0

### 7. Primer deploy

```bash
# desde tu maquina local, despues de un cambio cualquiera:
git push origin main
```

GitHub Actions correra el workflow `Deploy to EC2`. Ve el progreso en
**GitHub repo -> Actions**.

Tras unos 90-120 segundos deberias poder probar:

```bash
curl http://100.51.99.11/health
# -> {"status":"ok","env":"production"}
```

Y abrir en el navegador:

```
http://100.51.99.11/api/docs
```

para ver la documentacion Swagger.

## Operacion diaria

### Hacer un deploy nuevo

Simplemente hacer `git push origin main`. El workflow se dispara solo.

### Disparar deploy manualmente

GitHub repo -> Actions -> Deploy to EC2 -> Run workflow.

### Ver logs en el EC2

```bash
ssh -i backendViaje.pem ubuntu@100.51.99.11
cd /home/ubuntu/viajeseguro-backend
docker compose logs -f api       # logs del API
docker compose logs -f nginx     # logs de nginx
```

### Reiniciar sin re-deployar

```bash
docker compose restart api
```

### Aplicar una nueva migracion SQL

```bash
ssh -i backendViaje.pem ubuntu@100.51.99.11
cd /home/ubuntu/viajeseguro-backend
psql -h <ENDPOINT_RDS> -U postgres -d viajeseguro -f db/migrations/00X_<nombre>.sql
```

## Rollback rapido

Si un deploy rompio algo, revertir el commit en GitHub:

```bash
git revert HEAD
git push origin main
```

El workflow se dispara y deja el codigo anterior corriendo en ~90s.

## Pendientes para mas adelante

- [ ] HTTPS con Let's Encrypt + certbot, o capa Cloudflare (gratis).
- [ ] Dominio propio para reemplazar la IP.
- [ ] Rotacion automatica del JWT_SECRET (rompe sesiones, planificar ventana).
- [ ] Migraciones automatizadas (ej. `node-pg-migrate`) que corran como step del deploy en lugar de aplicarse a mano.
- [ ] Servicio analitico Python (ML/NLP) como segundo container en el mismo docker-compose.
- [ ] Backups verificados de RDS (snapshot automatico ya esta activo si se configuro en RDS).
