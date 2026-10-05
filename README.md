[![CI](https://github.com/agustinagonzalezz/ingsoft3-tps/actions/workflows/ci.yml/badge.svg)](https://github.com/agustinagonzalezz/ingsoft3-tps/actions/workflows/ci.yml)

# tp-inge3 - TeamPay mini

App de gestion de jugadoras, eventos y pagos de un equipo. Repo del semestre
para Ingenieria de Software 3 (UCC).

## Arquitectura

```
browser ──> frontend (nginx :80, publicado en :3000)
              ├─ /        -> SPA React (archivos estaticos)
              └─ /api/*   -> proxy a backend:8080 ──> postgres:5432
```

| Carpeta     | Que es                                   | Stack                                  |
|-------------|------------------------------------------|----------------------------------------|
| `backend/`  | API REST + reglas de negocio + migraciones | Node 22, Express 5, Prisma 7 (adapter-pg), TypeScript |
| `frontend/` | SPA (3 pantallas: jugadoras, eventos, dashboard) | React 19, Vite, React Router, Tailwind 4 |
| raiz        | orquestacion y CI                         | docker-compose, GitHub Actions         |

El frontend **nunca** habla con la base: todo pasa por la API. Llama siempre a
rutas relativas (`/api/...`); quien las lleva al backend es el proxy de Vite en
desarrollo y nginx en el contenedor. Por eso no hace falta CORS y la misma
imagen del front sirve en cualquier entorno.

### Endpoints

| Metodo | Ruta                                       | Que hace                                   |
|--------|--------------------------------------------|--------------------------------------------|
| GET    | `/api/health`                              | healthcheck                                |
| GET    | `/api/dashboard`                           | recaudado, pendiente, gastos, balance      |
| GET    | `/api/jugadoras`                           | lista con la deuda calculada               |
| POST   | `/api/jugadoras`                           | alta `{ name }`                            |
| PATCH  | `/api/jugadoras/:id`                       | `{ name?, active? }`                       |
| GET    | `/api/eventos`                             | eventos con participantes y estado de pago |
| POST   | `/api/eventos`                             | alta `{ name, type, amount, dueDate }` (400 si monto <= 0) |
| DELETE | `/api/eventos/:id`                         | 409 si el evento tiene pagos               |
| POST   | `/api/eventos/:eventId/eximir/:playerId`   | exime a una jugadora de un evento          |
| PUT    | `/api/participaciones/:id/pago`            | marca pagada (el monto lo calcula el back) |
| DELETE | `/api/participaciones/:id/pago`            | desmarca el pago                           |

## Arranque con Docker (recomendado)

Requisitos: Docker y Docker Compose instalados.

```bash
git clone https://github.com/agustinagonzalezz/ingsoft3-tps.git
cd ingsoft3-tps

cp .env.example .env
docker compose up -d --build
docker compose ps              # postgres y backend "healthy", frontend "running"
docker compose logs backend    # confirma que "prisma migrate deploy" corrio sin errores
```

- App: http://localhost:3000
- API directa (para curl/Postman): http://localhost:8080/api/health

Datos de ejemplo (opcional): la imagen de produccion no trae `tsx`, asi que el
seed se corre desde tu maquina contra la base del compose (publicada en 5432):

```bash
cd backend && npm install && cp .env.example .env && npm run seed
```

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

Usa `ghcr.io/agustinagonzalezz/teampay-backend` y `teampay-frontend` en vez de
construirlas localmente.

## Desarrollo local (sin Docker para el codigo)

Tres terminales:

```bash
# 1) solo la base, publicada en localhost:5432
docker compose up -d postgres

# 2) backend en http://localhost:8080
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed        # opcional: datos de ejemplo
npm run dev

# 3) frontend en http://localhost:5173 (Vite proxea /api al backend)
cd frontend
npm install
npm run dev
```

`DATABASE_URL` en `backend/.env` apunta a `localhost:5432`, no a
`postgres:5432` (ese nombre solo resuelve dentro de la red de Docker).

## Documentacion

- `decisiones.md`: decisiones de cada TP (incluida la separacion front/back).
- `evidencias.md`: capturas del TP2.
