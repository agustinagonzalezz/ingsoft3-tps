# Imagen del FRONTEND: se compila la SPA con Node y se sirve con nginx.
# Imágenes base desde mirror.gcr.io (espejo de Docker Hub): en el CI, Docker Hub sin login
# corta con 429 Too Many Requests (límite por IP, compartida entre runners). Misma imagen oficial.

# ---- Etapa 1: build (Node + Vite) ----
FROM mirror.gcr.io/library/node:22-alpine AS build
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
FROM mirror.gcr.io/library/nginx:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
