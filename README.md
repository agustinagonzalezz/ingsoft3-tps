# tp-inge3

Mini app de gestión de cuotas y gastos para un equipo de fútbol amateur.
Base para la serie de TPs de Ingeniería de Software III (CI/CD, testing,
dockerización, IaC, seguridad). Un solo equipo hardcodeado, sin login,
sin dependencias externas que requieran API key.

## Stack

Next.js (App Router) + TypeScript, Prisma 7 + PostgreSQL, Tailwind CSS,
Docker Compose para la base local.

## Levantar el proyecto desde cero

```bash
# 1. Instalar dependencias
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. Levantar Postgres local
docker compose up -d

# 4. Aplicar las migraciones (regenera el cliente de Prisma automáticamente)
npx prisma migrate dev

# 5. Cargar datos de prueba
npx prisma db seed

# 6. Arrancar en modo desarrollo
npm run dev
```

La app queda en [http://localhost:3000](http://localhost:3000) (redirige a `/dashboard`).

## Otros comandos

```bash
npm run build        # build de producción
npm start             # levanta el build de producción
npm run lint           # ESLint
npx tsc --noEmit       # chequeo de tipos

npx prisma studio          # explorador de datos en localhost:5555
npx prisma migrate reset   # ⚠️ resetea la base y vuelve a correr el seed
docker compose down        # baja Postgres
```

## Pantallas

- `/jugadoras` — alta, edición de nombre y estado activa/inactiva.
- `/eventos` — alta de eventos (cuota/torneo/amistoso/otro), estado de pago
  por jugadora y marcado de pagos.
- `/dashboard` — recaudado, pendiente de cobro, gastos y balance neto.

## Reglas de negocio

Están implementadas como funciones puras en [`src/lib/rules.ts`](src/lib/rules.ts),
sin Prisma ni Next.js — pensadas para poder testearse con datos planos, sin
mockear la base:

| Función | Qué hace |
|---|---|
| `calcularDeudaJugadora` | Deuda total de una jugadora sumando lo que debe por cada evento en el que participa, con soporte de pagos parciales. |
| `calcularBalanceEquipo` | Recaudado - gastos del equipo, opcionalmente filtrado por rango de fechas. |
| `puedeEliminarEvento` | Rechaza el borrado de un evento que ya tiene pagos asociados. |
| `validarMontoEvento` | Rechaza montos de evento <= 0. |
| `eximirJugadora` | Exime a una jugadora de un evento puntual (su deuda por ese evento pasa a 0). |
| `jugadoraInactivaSinDeudaFutura` | Filtra los eventos creados después de que una jugadora se dio de baja, para que no le sigan sumando deuda (conserva su historial de pagos pasados). |

El resto de las capas: `src/lib/db.ts` (singleton de PrismaClient con driver
adapter), `prisma/schema.prisma` (modelo de datos) y `src/app/**` (páginas y
Server Actions que llaman directo a `db` y a `rules.ts`, sin capas
intermedias).
