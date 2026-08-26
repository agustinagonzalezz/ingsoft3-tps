
## TP2 — Contenedores

### Por qué esta app

Elegí mi propia app (TeamPay mini: gestión de jugadoras, eventos y pagos de
un equipo), ya en desarrollo antes de este TP, contra los 5 criterios de la
guía:

1. **¿Corre hoy?** Sí, la vengo usando localmente desde antes del TP2.
2. **¿Conozco los comandos de build/run?** Sí: `npm run build` / `npm run
   dev` (Next.js estándar). No hay pasos ocultos ni scripts custom.
3. **¿Dónde se configura la conexión a la base?** En `prisma.config.ts` →
   `datasource.url: process.env["DATABASE_URL"]`. Es 100% parametrizable por
   variable de entorno, sin tocar código — clave para este TP (la base pasa
   a vivir en un contenedor con otro host) y para el TP6 más adelante (QA vs
   producción).
4. **¿Tiene lógica para testear?** Parcialmente: ya tengo algunas reglas
   (estado activo/inactivo de jugadoras, cálculo de deuda). Todavía no conté
   cuántas dan en limpio contra las 4-6 que pide el TP5 — queda anotado como
   pendiente a revisar antes de esa entrega, y si faltan, agregarlas ahora
   que la arquitectura ya está estable es más simple que después.
5. **¿La entiendo lo suficiente para modificarla en vivo?** Sí

Tamaño: 3 pantallas (jugadoras, eventos, dashboard) — dentro de lo que pide
la guía. Sin dependencias exóticas: solo Postgres.

### Decisiones de contenerización

**Una sola imagen de app, no dos (front + back) como el sample de la
cátedra.** Next.js con App Router unifica frontend (páginas SSR) y API
(Route Handlers) en un mismo proceso Node — no hay una "capa de API" corriendo
por separado que tenga sentido dockerizar aparte. El sistema queda en 2
servicios: `app` (Next.js) y `postgres`.

**Imagen base:** `node:22-alpine` en todas las etapas — Alpine para mantener
la imagen final chica; Node 22 porque es la que uso en desarrollo.

**Dockerfile multi-stage, 4 etapas** (no 3, por un problema puntual que
detallo abajo):
- `deps`: instala dependencias con `npm ci`.
- `builder`: copia el código, corre `prisma generate` y `next build` (con
  `output: "standalone"` para que la imagen final no cargue con todo
  `node_modules`).
- `prisma-cli`: etapa nueva, instala el CLI de Prisma de forma aislada.
- `runner`: imagen final, Alpine mínima, usuario no-root, arranca con
  `docker-entrypoint.sh` (corre `prisma migrate deploy`) y después
  `node server.js`.

**Qué persiste y qué no:** solo los datos de Postgres, vía el volumen
nombrado `postgres_data`. El contenedor `app` no guarda ningún estado propio
— se puede destruir y recrear sin pérdida, y de hecho eso es exactamente lo
que se prueba en `evidencias.md` (`down`/`up` conserva datos, `down -v` los
borra).

**Variables sensibles:** vía `.env` (no versionado) + `.env.example`
(versionado, sin valores reales). `docker-compose.yml` las inyecta a los
contenedores por variable de entorno, nunca hardcodeadas.

**`depends_on` + `healthcheck`:** el servicio `app` espera a que `postgres`
esté `service_healthy` (chequeado con `pg_isready`), no solo `started`. Sin
esto, `app` podría arrancar y ejecutar `prisma migrate deploy` contra una
base que todavía está inicializando, y fallar de forma intermitente y difícil
de reproducir.

### Problemas encontrados y cómo los resolví

1. **`next build` fallaba con `DATABASE_URL no está definida`.** Next intenta
   pre-renderizar páginas en build time, y mi código de conexión a la base
   revienta si esa variable no existe. Solución: `ENV DATABASE_URL` con un
   valor ficticio, puesto **solo en la etapa `builder`** del Dockerfile (no
   se propaga a la imagen final porque cada `FROM` en un multi-stage arranca
   sin las variables de la etapa anterior). No se conecta de verdad, solo
   hace que el chequeo de "existe la variable" pase.

2. **Páginas con queries directas fallaban en build con `ECONNREFUSED`.**
   `/dashboard`, `/eventos` y `/jugadoras` llaman a Prisma directo desde el
   Server Component, y Next las quería pre-renderizar como estáticas en
   build time (cuando no hay Postgres real corriendo). Solución: agregar
   `export const dynamic = "force-dynamic"` en esas 3 páginas, para que Next
   las resuelva en cada request en vez de intentar congelarlas en el build —
   que además es lo correcto semánticamente, porque son datos que cambian.

3. **El CLI de Prisma se rompía al copiarlo entre etapas del build.**
   `node_modules/.bin/prisma` es un symlink (no un archivo real): apunta a
   `node_modules/prisma/build/index.js`. Docker, al copiar un symlink entre
   etapas (`COPY --from=`), copia el contenido del archivo apuntado pero lo
   deja en la ruta original del symlink — rompiendo las rutas relativas que
   ese archivo usa internamente para encontrar sus propias dependencias.
   Intentar reconstruir el árbol de `node_modules` del CLI a mano (copiando
   cada dependencia transitiva) no escala: Prisma 7 arrastra un árbol grande.
   Solución: agregar una etapa (`prisma-cli`) que instala el CLI de forma
   aislada con `npm install --omit=dev --no-save`, dejando que `npm` arme los
   symlinks correctamente sin cruzar etapas, y copiar ese `node_modules`
   completo (pequeño, ~250MB) al `runner`.

### Uso de IA

Usé Claude (conversación de chat) para el diseño inicial del Dockerfile y
docker-compose, y Claude Code para diagnosticar y resolver el problema del
symlink del CLI de Prisma (punto 3 de arriba) — ese fue el más complejo y
requirió iterar sobre el error real hasta encontrar la causa raíz.

Cómo lo verifiqué: corrí yo misma cada paso (build, up, logs, pruebas de
persistencia con `down`/`down -v`) y confirmé los resultados esperados en mi
propia máquina antes de darlos por buenos — están documentados con capturas
en `evidencias.md`. Entiendo por qué cada corrección funciona (lo explico en
la sección de problemas de arriba) y puedo defenderlo en la mesa: qué hace
cada etapa del Dockerfile, por qué el CLI necesita su propia etapa, y por qué
las páginas necesitan `force-dynamic`.