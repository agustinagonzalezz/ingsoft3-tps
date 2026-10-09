# syntax=docker/dockerfile:1
# Imagen del BACKEND (API Express + Prisma). El frontend tiene su propia imagen.

# ---- Etapa 1: dependencias + build (TypeScript -> JavaScript) ----
FROM node:22-alpine AS build
WORKDIR /app
# Primero solo los manifiestos y el schema: si no cambian, `npm ci` sale de cache.
# El schema hace falta porque el postinstall corre `prisma generate`.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json tsconfig.build.json vitest.config.ts ./
COPY src ./src
# Solo compila. Las devDependencies (typescript, vitest, @types/*) se QUEDAN:
# la etapa de tests sale de acá y las necesita. El prune pasó a su propia etapa.
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node, el código y vitest) ----
# Sin WORKDIR: hereda /app de build. ENTRYPOINT y no RUN: los tests corren en el
# `docker run` del pipeline, y el reporte sale por el volumen montado.
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: dependencias de producción (antes era el prune del build) ----
FROM build AS prod-deps
RUN npm prune --omit=dev

# ---- Etapa 4: runtime (sin compilador ni devDependencies) ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# Necesarios para `prisma migrate deploy` al arrancar:
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./
COPY --chown=node:node docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Usuario sin privilegios que ya trae la imagen oficial de Node.
USER node
EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
