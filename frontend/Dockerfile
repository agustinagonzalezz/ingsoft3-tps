# syntax=docker/dockerfile:1
# Imagen del FRONTEND: se compila la SPA con Node y se sirve con nginx.

# ---- Etapa 1: build (Node + Vite) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node, el código y vitest) ----
# `npm ci` sin --omit=dev, así que vitest está. Sin WORKDIR: hereda /app.
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: runtime (solo nginx + archivos estáticos; Node no viaja) ----
FROM nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
