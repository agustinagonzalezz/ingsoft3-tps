# tp-inge3 - TeamPay mini

App de gestion de jugadoras, eventos y pagos de un equipo. Repo del semestre
para Ingenieria de Software 3 (UCC).

**Stack:** Next.js 16 (App Router) + Prisma 7 (@prisma/adapter-pg) + PostgreSQL.

## Arranque con Docker (recomendado)

Requisitos: Docker y Docker Compose instalados.

```bash
git clone https://github.com/agustinagonzalezz/ingsoft3-tp01.git
cd ingsoft3-tp01

cp .env.example .env
# (opcional) edita .env y pone otra contrasena para la BD local

docker compose up -d --build
docker compose ps          # espera a ver "postgres" healthy y "app" running
docker compose logs app    # confirma que "prisma migrate deploy" corrio sin errores
```

La app queda disponible en http://localhost:3000

### Probar persistencia

```bash
docker compose down && docker compose up -d
# los datos siguen ahi: el volumen postgres_data sobrevive al down sin -v

docker compose down -v && docker compose up -d
# ahora si se pierden: -v borra tambien los volumenes
```

### Levantar desde las imagenes publicadas (sin build local)

```bash
docker compose -f docker-compose.registry.yml up -d
```

Baja la imagen ya publicada en ghcr.io/agustinagonzalezz/ingsoft3-tp01:v0.1.0
en vez de construirla localmente.

## Desarrollo local (sin Docker)

Si preferis correr la app directo en tu maquina (con Postgres dockerizado
aparte):

```bash
docker compose up -d postgres   # solo la base, publicada en localhost:5432
npm install
npm run dev
```

Asegurate de que DATABASE_URL en tu .env apunte a localhost:5432 (no a
postgres:5432, que solo funciona dentro de la red de Docker).

## Documentacion del TP2 (Dockerizacion)

- decisiones.md: justificacion de la app elegida y decisiones de arquitectura de contenedores.
- evidencias.md: capturas de todo funcionando de punta a punta.
