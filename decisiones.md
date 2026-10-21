## Enlaces del TP7

Lo que no se encuentra navegando el repo. (Los enlaces del TP6 siguen abajo.)

**(a) Los dos paquetes públicos**, con la etiqueta `sha-<commit>` de la versión que llegó a PROD con la cadena completa: `9b5c9cf` (PR #41). Se bajan sin credenciales:

```bash
docker pull ghcr.io/agustinagonzalezz/ingsoft3-tps-backend:sha-9b5c9cf4b5a03a66ec201ac2aa6851e75bb92077
docker pull ghcr.io/agustinagonzalezz/ingsoft3-tps-frontend:sha-9b5c9cf4b5a03a66ec201ac2aa6851e75bb92077
```

- Backend: https://github.com/users/agustinagonzalezz/packages/container/package/ingsoft3-tps-backend
- Frontend: https://github.com/users/agustinagonzalezz/packages/container/package/ingsoft3-tps-frontend

**(b) La corrida donde la integración quedó VERDE y la e2e ROJA**, y PROD no llegó ni a pedir aprobación:

- Commit que rompió la app (cambia el texto del botón; no toca `e2e/`): https://github.com/agustinagonzalezz/ingsoft3-tps/commit/83505ff7a82c57230a7499d275db1c5106f1a1d3 (PR #40)
- Corrida: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/39528868670
- Reporte de integración, en verde: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/39528868670/artifacts/12314841314 (`playwright-report-integracion`)
- Reporte e2e, en rojo (con captura y traza): https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/39528868670/artifacts/12314812482 (`playwright-report-e2e`)

**(c) La corrida completa en verde posterior, hasta PROD** (el arreglo, PR #41): https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/39616333944

**(d) Los entornos** (los mismos del TP6, ahora ejecutando la imagen):

| | Frontend | API |
|---|---|---|
| QA | https://teampay-front-qa.onrender.com | https://teampay-api-qa.onrender.com/api/health |
| PROD | https://teampay-front-prod.onrender.com | https://teampay-api-prod.onrender.com/api/health |

> Free tier de Render: si nadie los visitó en los últimos 15 minutos, el primer pedido tarda hasta un minuto (y puede dar 502 o 429 mientras se despiertan). El `/api/health` devuelve el `commit` del que salió la imagen que está corriendo.

---

## Enlaces de este TP (TP6)

Lo que no se encuentra navegando el repo:

**(a) Los dos paquetes públicos**, etiquetados con el commit de un merge: `4cfaaeb` (PR #34, el primer cambio que aprobé hacia PROD). Se bajan sin credenciales:

```bash
docker pull ghcr.io/agustinagonzalezz/ingsoft3-tps-backend:sha-4cfaaeb179522cfa67639cca2aeb48aa2fcf36e4
docker pull ghcr.io/agustinagonzalezz/ingsoft3-tps-frontend:sha-4cfaaeb179522cfa67639cca2aeb48aa2fcf36e4
```

- Backend: https://github.com/users/agustinagonzalezz/packages/container/package/ingsoft3-tps-backend
- Frontend: https://github.com/users/agustinagonzalezz/packages/container/package/ingsoft3-tps-frontend

**(b) Los dos enlaces de la cadena** (Tarea 1):

1. Job de un PR con los tests en verde y **«Entrar al registry» salteado** (sólo `main` publica): https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/38182434280/job/114597636191
2. Corrida de `main` donde **«Construir y publicar la imagen» es el último paso**, después de los tests: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/38182802064/job/114598748377

**(c) Los entornos:**

| | Frontend | API |
|---|---|---|
| QA | https://teampay-front-qa.onrender.com | https://teampay-api-qa.onrender.com/api/health |
| PROD | https://teampay-front-prod.onrender.com | https://teampay-api-prod.onrender.com/api/health |

> Son del free tier de Render: si nadie los visitó en los últimos 15 minutos, el primer pedido tarda hasta un minuto en contestar (el servicio se despierta).

---

## TP1 - Git colaborativo

### Por que Git no pudo resolver el conflicto solo

Dos ramas (\feature/titulo-a\ y otra rama en paralelo) modificaron la **misma linea** del mismo archivo (\README.md\, la linea del titulo del proyecto) de forma simultanea, cada una con un texto distinto. Git resuelve automaticamente los cambios que tocan lineas o archivos distintos, pero cuando dos ramas editan la misma linea no tiene forma de decidir cual de las dos versiones es la "correcta" ? ambas son ediciones vlaidas del mismo lugar del archivo, y elegir entre ellas es una decision de contenido, no algo que se pueda resolver con un algoritmo de diff. Para que nunca hubiera aparecido el conflicto, alguna de las dos ramas tendria que haber hecho \pull\/rebase de \main\ antes de tocar esa linea, viendo el cambio de la otra rama antes de proponer el propio.

### Problemas encontrados y como los resolv?

- El push directo a \main\ fue rechazado por la proteccion de rama configurada o confirmo que la regla alcanza tambien al dueño del repositorio, no solo a colaboradores externos.
- Ademas del conflicto resuelto en el Pull Request, en algun punto me quedo un merge sin terminar **localmente**: Git bloqueaba \git switch main\ con el error \README.md: needs merge\ / \you need to resolve your current index first\. Eso significa que habia un conflicto de merge a mitad de resolver en mi copia local, distinto del conflicto ya resuelto en GitHub. Until it was cleared, ninguna rama nueva se podia crear. Lo resolvi revisando el estado con \git status\, identificando el archivo a medio resolver (\README.md\), completando su resolucion y confirmando el commit del merge antes de poder cambiar de rama.

### Declaracion de uso de IA

Use ChatGPT puntualmente para diagnosticar el error de merge local (\
eeds merge\ / \
esolve your current index first\) que me bloqueaba \git switch main\ ? no lograba identificar por que Git no me dejaba cambiar de rama si en apariencia no habia nada pendiente de mergear en GitHub. La IA me explico que el problema estaba en mi copia local, no en el remoto, y me guio a revisar \git status\ para encontrar el archivo a medio resolver. Lo verifique corriendo yo misma cada comando sugerido y confirmando en la salida de \git status\ que el conflicto local desaparecia antes de continuar. El resto del TP (ramas, PR, protecci?n de \main\, release) lo hice siguiendo la guia de la catedra sin asistencia adicional de IA.


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

## TP3 - Planificación y trazabilidad

### Duración del sprint
Elegí un sprint de 2 semanas. Con la cursada organizada en entregas periódicas de TPs, un ciclo de 2 semanas da margen suficiente para completar una historia con sus tareas sin que el sprint quede vacío de contenido (como pasaría con 1 semana, muy ajustado para el ritmo de la materia), y sin extenderse tanto como para perder el sentido de "iteración corta" que tiene un sprint (como pasaría con 4 semanas).

### Límite de trabajo en progreso (WIP)
Configuré el límite en 2 para la columna "In Progress". La regla de arranque es cantidad de personas + 1; trabajando solo, eso da 1 + 1 = 2. El "+1" es la válvula de escape para cuando algo queda trabado esperando una revisión o una respuesta externa y necesito poder avanzar en otra cosa sin quedarme frenado. Si en la práctica nunca llego a alcanzar el límite, es señal de que está demasiado alto y convendría bajarlo a 1.

### Diagnóstico de la historia mal escrita
La historia "Como desarrollador quiero crear la tabla usuarios para guardar los datos" está mal escrita porque es una tarea disfrazada de historia: describe una acción técnica interna (crear una tabla), no un incremento de valor observable por un usuario o rol de negocio. Nadie "quiere" una tabla; el "para" no justifica una prioridad de producto, solo describe un paso de implementación. La reescribiría subiendo un nivel de abstracción, por ejemplo: "Como usuario quiero poder registrarme en la aplicación para acceder con mis propias credenciales" — y "crear la tabla usuarios" pasaría a ser una de las tareas técnicas dentro de esa historia.

### Problemas encontrados y cómo los resolví
Al armar la jerarquía, intenté pararme en el repo usando un placeholder de ruta sin reemplazarlo (<tu-repo-de-la-app>), lo que generó un error de ruta inválida en PowerShell. Lo resolví listando el contenido de la carpeta con `dir` hasta encontrar la carpeta real del proyecto, y confirmando que era el repo correcto con `git status` y `git remote -v`.
Descubrí en el proceso que mi repo local había quedado en una carpeta anidada con el mismo nombre (`ingsoft3-tps/ingsoft3-tps`) y que el remoto había sido renombrado respecto al que usé en TP1/TP2 (`ingsoft3-tp01` → `ingsoft3-tps`). Verifiqué con `git remote -v` y `dir` que el contenido de la app (Dockerfile, decisiones.md, evidencias.md previos) seguía intacto antes de continuar, para no perder trabajo previo.
Al crear el PR de CI, tuve que confirmar explícitamente que el `Closes #N` apuntara al número de la tarea (#10) y no al de la historia (#9), para no cerrar la historia con trabajo pendiente sin terminar.

### Declaración de uso de IA
Usé Claude (Anthropic) como asistente durante todo el TP3: guía paso a paso para crear las etiquetas, la épica, la historia, las tareas y el bug vía `gh issue create`; armado de la jerarquía con `gh issue edit --add-sub-issue`; configuración del Project (visibilidad pública, vista Board, campo Sprint, límite de WIP); y redacción del workflow `.github/workflows/ci.yml` y el PR de trazabilidad. Verifiqué cada paso ejecutando los comandos yo mismo y revisando la salida real en mi terminal y en GitHub (números de issue, estado de los checks del PR, campo "Parent" y "Projects" del issue cerrado) antes de continuar al siguiente paso.

## TP4 - CI: Pipelines as Code

### Estructura elegida del pipeline
> **Actualización posterior:** después del TP4 separé la app en backend y frontend (ver la sección «Refactor» más abajo) y el pipeline pasó a ser un job con matriz `[backend, frontend]`. Lo que sigue describe cómo estaba al entregar el TP4.

Mi app tiene un único Dockerfile (Next.js con App Router unifica front y back en un solo proceso, decisión ya justificada en el TP2), así que el pipeline tiene un solo job (`build`) en vez de los dos jobs en paralelo (backend/frontend) que propone la guía para stacks separados. No inventé un segundo job vacío para llegar a un número: el pipeline construye exactamente lo que la app tiene. El trigger es `pull_request` (verifica antes del merge, alimenta el gate) y `push` a `main` (deja la corrida que lee el badge y que además guarda el cache que después reutiliza cualquier PR nuevo).

### Qué cachea el pipeline
Se cachean las capas de la imagen Docker vía `docker/setup-buildx-action` + `cache-from`/`cache-to: type=gha`. En la segunda corrida del mismo PR, todas las capas mostraron `CACHED`: la instalación de dependencias (`npm ci`), la generación de Prisma (`npx prisma generate`), el build de Next (`npm run build`) y todas las copias entre etapas del Dockerfile multi-stage. Esto tiene sentido porque entre una corrida y la otra no cambió ningún archivo relevante (usé un commit vacío para dispararla). Si el cache desaparece, el pipeline sigue funcionando igual, solo que reconstruye todo desde cero — no es una dependencia real, es una optimización de velocidad.

### Por qué el pipeline construye con mi Dockerfile en vez de compilar por su cuenta
Si el workflow corriera `npm run build` directamente en vez de delegarle todo a `docker build`, tendría dos definiciones distintas de cómo se arma la app: la que usa el pipeline para verificar, y la que uso después para desplegar (vía el mismo Dockerfile). Con el tiempo esas dos definiciones divergen y terminaría verificando algo distinto de lo que realmente se despliega. Usando el Dockerfile como única fuente de verdad, lo que el pipeline verifica es exactamente lo que se va a correr en producción.

### Problemas encontrados y cómo los resolví
Al configurar el gate por la web (Settings → Branches → Require status checks), el checkbox se guardó pero el campo `contexts` quedó vacío — lo detecté corriendo `gh api .../branches/main/protection --jq '.required_status_checks'` antes de seguir. Lo resolví aplicando la protección completa vía `gh api --method PUT`, re-declarando también lo que ya tenía del TP1 (0 approvals + `enforce_admins: true`) para no perderlo, ya que el PUT reescribe la protección entera en vez de mezclarla.
Al agregar el badge del README en un PR nuevo, el merge con `main` generó un conflicto porque un PR anterior (el de relleno de la demo del gate) había agregado una línea en blanco al final del mismo archivo. Lo resolví actualizando primero mi `main` local (estaba desactualizado respecto del remoto, por eso `git merge main` no traía nada al principio), y después resolviendo el conflicto a mano en VS Code conservando ambos cambios: el badge arriba y el resto del contenido tal como estaba.
Verifiqué que el error de "Cannot merge binary files" que mostró Git no era un problema real de codificación (los bytes del archivo eran ASCII/UTF-8 normal) sino un falso positivo del propio Git al intentar el auto-merge; se resolvió igual editando el archivo directamente.

### Declaración de uso de IA
Usé Claude (Anthropic) como asistente durante todo el TP4: adaptación del workflow de dos jobs a uno solo (justificada por mi Dockerfile único), redacción del YAML con cache de capas, configuración del gate vía `gh api`, diagnóstico del conflicto de merge en el README y de la protección de rama mal guardada, y armado de la secuencia de la demo (romper el build → PR bloqueado → fix → verde → merge). Verifiqué cada paso ejecutando los comandos yo mismo: revisé el log de cada corrida en la pestaña Actions (`CACHED` en las capas, el error real de TypeScript al romper el build), el estado real de la protección de rama con `gh api`, y el resultado final del README y el badge en GitHub antes de dar cada paso por cerrado.

## Refactor: separación frontend / backend

### Qué cambió y por qué
Hasta el TP4 la app era un único proceso Next.js (páginas SSR + server actions que hablaban directo con Prisma), y en el TP2 justifiqué una sola imagen por eso. Al revisarlo con el profesor, el requisito mínimo de la materia ("frontend + backend + base de datos") pide que sean **componentes separados**, así que revisé esa decisión: el repo pasa a tener `backend/` y `frontend/`, cada uno con su `package.json`, su Dockerfile y su imagen.

- **Backend** (`backend/`): API REST con Express 5 + Prisma 7. Es el único que conoce la base. Reutiliza tal cual `schema.prisma`, la migración existente y `rules.ts` (las 6 reglas de negocio puras), así que no hubo que migrar datos ni reescribir la lógica.
- **Frontend** (`frontend/`): SPA React + Vite, las mismas 3 pantallas. Los server actions de Next se reemplazaron por llamadas `fetch` a `/api/...` centralizadas en `src/api.ts`.
- **Elegí React + Vite + nginx en vez de mantener Next.js** porque es el mismo patrón que el sample de la cátedra: la SPA llama a rutas relativas y nginx proxea `/api` al backend por la red de compose. Así no hay CORS y la imagen del front no tiene la URL del backend "horneada", lo que va a importar en TP6/TP7 (misma imagen, distintos entornos). Con Next, el proxy (`rewrites`) se resuelve en build time.
- **Express en vez de Go** (que también manejo) porque permitía reutilizar Prisma, el schema y `rules.ts` sin reescribirlos.

### Qué se simplificó gracias a la separación
- Desaparecieron los dos parches del TP2: el `DATABASE_URL` falso en build time y el `force-dynamic` en las páginas. Ahora el build del backend es solo `tsc` (no ejecuta código ni intenta conectarse a nada) y el front no tiene acceso a la base.
- Desapareció la etapa `prisma-cli`: como el backend ya no usa el `standalone` de Next, `prisma` pasa a ser dependencia de runtime, se instala con `npm ci`, se compila y después `npm prune --omit=dev` saca las devDependencies. El `node_modules` que llega a la imagen final lo arma npm en una sola etapa, con los symlinks correctos.

### Arquitectura de contenedores
3 servicios en `docker-compose.yml`:
- `postgres` (igual que antes, con healthcheck `pg_isready`).
- `backend` (`node:22-alpine`, 2 etapas: build → runtime, usuario `node` no-root). Al arrancar corre `prisma migrate deploy` y después la API en el 8080. Tiene healthcheck contra `/api/health`.
- `frontend` (2 etapas: `node:22-alpine` compila con Vite → `nginx:alpine` sirve los estáticos; Node no viaja a la imagen final). Publicado en el 3000 (misma URL que antes). Espera a que el backend esté `service_healthy`.

La cadena de arranque queda `postgres healthy → backend healthy → frontend`, así nginx nunca recibe tráfico de `/api` sin backend detrás.

### Validaciones: front vs back
El front sigue deshabilitando "Crear evento" si falta nombre o el monto no es > 0 (regla de UI, sirve para los tests de frontend del TP5), pero **el backend vuelve a validar** y responde 400: cualquiera puede pegarle a la API sin pasar por el formulario. De la misma forma, borrar un evento con pagos devuelve 409, y el monto de un pago ahora lo calcula el backend (antes lo mandaba el cliente y se podía registrar cualquier importe).

### CI
El workflow pasa de un job a un job con `matrix: [backend, frontend]`: cada componente se construye en paralelo con su propio contexto y su propio scope de cache (`scope=backend` / `scope=frontend`), así un cambio solo en el front no invalida el cache del back. Como los checks ahora se llaman `build (backend)` y `build (frontend)`, actualicé los required status checks de `main` con `gh api` (el contexto viejo `build` ya no existe y dejaría todos los PRs bloqueados).

### Declaración de uso de IA
Usé Claude (Anthropic) para hacer la separación: estructura de carpetas, la API Express a partir de los server actions existentes, el port de las pantallas a React + Vite, los Dockerfiles, nginx.conf, el compose y el workflow. Lo verifiqué levantando el sistema en mi máquina con `docker compose up --build`, probando cada pantalla y los endpoints con curl (incluidos los casos de error 400/404/409), y revisando que el pipeline quedara en verde en el PR.

## TP5 - Calidad automatizada: tests, coverage y el umbral que frena un merge

### En una frase
El pipeline ahora corre los tests del backend y del frontend en cada PR, mide la cobertura, la muestra en el resumen de la corrida y **no deja mergear** si la cobertura queda por debajo de mi número (90% de líneas y 85% de ramas), aunque el código compile y todos los tests pasen.

### Qué testeé y por qué eso
Me pregunté dónde duele un bug en TeamPay: en la **plata**. Si una regla calcula mal, a una jugadora se le cobra de más o de menos, o el balance del equipo miente. Por eso la suite se concentra ahí y no en la parte visual.

**Backend** (65 tests, con vitest 5):
- Las 6 reglas de negocio de `rules.ts`: deuda de una jugadora (con pagos parciales y monto personalizado), balance del equipo (con los bordes de las fechas), no borrar un evento que ya tiene pagos, monto mayor a 0, eximir a una jugadora y que una jugadora inactiva no siga sumando deuda.
- Lo que antes estaba escondido en las rutas y ahora vive en `rules.ts`/`mappers.ts` (ver "Qué dejé afuera"): validar un evento nuevo, validar y editar jugadoras (incluida la fecha de desactivación), el pendiente del equipo del dashboard y el monto esperado de cada participante.
- `marcarPago` (el servicio de pagos), con un mock (ver más abajo).

**Frontend** (42 tests, sin DOM):
- `reglas.ts`: cuándo se habilita "Crear evento", el contador "pagaron / faltan" (las exentas no cuentan), nombre obligatorio y el texto de error.
- `api.ts`: que cada pedido arme bien la URL, el método y el body, que un 4xx se convierta en el mensaje de error que ve el usuario, y que un 204 no intente leer el body.
- `format.ts`: formato de moneda y de fecha.

Las tres técnicas que pide el enunciado están **en los dos lados**:

| Técnica | Backend | Frontend |
|---|---|---|
| Parametrizado (`it.each`) | montos inválidos (0, negativo, NaN), cuerpos inválidos de un evento, bordes de fecha de `estadoDeEvento` | casos que no dejan crear un evento, nombres válidos e inválidos, una fila por cada ruta de la API |
| Caso de error / borde | evento sin nombre, tipo inexistente, monto 0, sin body; bordes como `0.01` o "exactamente 3 días" | 404/409/500 de la API, fecha inválida, monto `0.01` |
| Mock | `marcarPago` con un repo falso | `request` y `crearApi` con un `fetch` falso |

Para saber si un test vale, usé el criterio del enunciado: **cambiar la regla a propósito y ver si algo se pone en rojo**. Lo hice, por ejemplo, cambiando `?? null` por `?? 0` en el mapper (se puso en rojo el test de "sin override") y los bordes de fecha están pensados para que cambiar un `<=` por `<` rompa una fila.

### El test con mock, y el refactor que lo hizo posible
**Backend.** La lógica de "marcar como pagada" estaba adentro del handler de Express, pegada a Prisma: para probarla necesitaba una base de datos levantada. La moví a `services/pagos.ts` → `marcarPago(repo, id)`. La función ya no conoce Prisma: recibe un `PagosRepo` (dos funciones: buscar la participación y crear el pago). En la app le llega el repo real (`repos/pagosPrisma.ts`); en el test, uno hecho con `vi.fn()`.
- `buscarParticipacion` es un **stub**: solo devuelve datos preparados (exenta, ya pagada, etc.).
- `crearPago` es el **mock**: el test verifica *cómo se lo llamó* — `toHaveBeenCalledWith("p1", 1000)` cuando corresponde cobrar, y `not.toHaveBeenCalled()` cuando la jugadora está exenta o ya pagó. Ese segundo assert es el que importa: prueba que no se cobra dos veces.

**Frontend.** Pasó lo mismo con `fetch`: `request` lo llamaba directo. Ahora recibe el cliente HTTP por parámetro (`request(traer, ruta)`), y las rutas de la API se arman con `crearApi(traer)`. En la app se le pasa el `fetch` real en un solo lugar (`traerReal`); en los tests, un `vi.fn()` que registra qué URL y qué método se pidieron. Si mañana alguien cambia una ruta sin querer (por ejemplo `PUT` por `DELETE` en marcar pago), se pone en rojo su fila.

**El límite:** estos tests prueban mi código, no la conexión real entre front y back. Si el backend cambia lo que responde, el mock sigue contestando lo de antes. Eso se verifica de punta a punta en el TP7.

### Herramientas que usé, por fila de la tabla "Tu stack, de un vistazo"
Mi stack es TypeScript en los dos lados (no .NET), así que usé la columna JS/TS:

| Lo que había que lograr | Lo que usé |
|---|---|
| Dónde viven los tests | Al lado del código: `rules.ts` → `rules.test.ts` |
| Test parametrizado | `it.each` de vitest |
| Que la dependencia entre desde afuera | Parámetro de la función (`repo`, `traer`) |
| Fabricar el doble | `vi.fn()` de vitest |
| Medir la cobertura | `vitest run --coverage` con `@vitest/coverage-v8` (mide líneas **y** ramas sin pedir nada extra) |
| Umbral que rompe el build | `coverage.thresholds` en `vitest.config.ts` |
| Qué entra en la cuenta | `coverage.include` / `coverage.exclude` en `vitest.config.ts` |
| Reporte legible | reporters `text` (consola), `html` (descargable) y `json-summary` (lo lee el pipeline) |
| Que las herramientas de test entren a la etapa de tests | `npm ci` **sin** `--omit=dev` en la etapa que usan los tests |

### Qué dejé afuera de la cuenta, y por qué
La regla que seguí: se puede dejar afuera el **arranque** y lo que **no tiene lógica**, pero solo después de sacar de ahí cualquier regla. Al principio, las rutas de Express tenían adentro validaciones y cálculos (validar un evento nuevo, la fecha de desactivación de una jugadora, el pendiente del dashboard). Si las hubiera excluido así, el número habría dado alto escondiendo código sin tests. Así que primero **moví esa lógica a `rules.ts` y `mappers.ts` y le escribí tests**, y recién después excluí.

**Backend** (`backend/vitest.config.ts`):
- `src/generated/**`: el cliente que genera Prisma. No lo escribí yo.
- `src/index.ts` y `src/db.ts`: arranque (leen el puerto, crean la conexión).
- `src/app.ts`: arma Express (rutas, JSON, manejo de errores).
- `src/routes/**`: los handlers, que ahora solo piden a la base, llaman a la regla y traducen a HTTP (404, 409, 201…).
- `src/repos/**`: la implementación real del repo contra Prisma. Probarla requiere una base de verdad: se verifica en el TP7.

**Frontend** (`frontend/vitest.config.ts`): en vez de excluir, digo qué **sí** entra: `src/**/*.ts`, es decir, toda la lógica. Los componentes y páginas (`.tsx`) son la parte visual de React y se prueban de punta a punta en el TP7. También quedan afuera los tests y `useApi.ts` (un hook de React que necesita un navegador).

Al principio había puesto en el `include` del front una lista de archivos sueltos (`api.ts`, `format.ts`, `reglas.ts`). Lo cambié porque así **un archivo nuevo sin tests no entraba en la cuenta** y el umbral no lo veía: justo lo que el freno tiene que atrapar. El PR 2 (más abajo) lo demuestra: `recordatorio.ts` apareció solo en el reporte.

Cómo evolucionó la cobertura del backend mientras hacía esto (muestra que el número subió por tests nuevos, no solo por excluir):

| Momento | Tests | Líneas | Ramas |
|---|---|---|---|
| Primera medición (solo reglas y pagos) | 20 | 23% | 37% |
| Después de sacar la lógica de las rutas, sin excluir nada | 55 | 42% | 74% |
| Excluyendo `app.ts`, `routes/` y `repos/` | 56 | 100% | 100% |

En el front pasó algo parecido: `api.ts` daba 47% de líneas porque nadie probaba sus métodos. No lo excluí: escribí los tests del contrato de rutas y llegó a 100%.

### El umbral: 90% de líneas y 85% de ramas, en los dos lados
- **Hoy mido 100% de líneas y 100% de ramas** en el backend y en el frontend.
- **No puse 100** porque me obligaría a testear hasta la última línea defensiva, y un número imposible empuja a escribir tests que ejecutan sin verificar nada solo para llegar (lo que la guía llama ley de Goodhart).
- **Tampoco puse 80** (el del ejemplo) porque mi código es chico: en el backend hay 74 líneas medidas, y con 80 harían falta unas 19 líneas nuevas sin test para que frene. Con 90, alcanzan unas 9: una función nueva sin tests ya lo pone en rojo.
- **Pongo umbral en las dos métricas** porque frenan en casos distintos: en mi PR 1 frenó solo líneas y en el PR 2 frenaron las dos.
- **No pongo umbral en funciones** porque en el front hay una función que dejo sin test a propósito (`traerReal`, el `fetch` real) y me tendría el número en 95,8% para siempre.
- **Si lo subiera 10 puntos (a 100):** cualquier refactor que agregue una línea de seguridad sin su test rompería el build. **Para poder exigir más** tendría que sumar tests de los handlers con una base real (integración) y volver a meter `routes/` y `repos/` en la cuenta.

### El pipeline (TP4 + tests)
Los tests corren **adentro de los mismos jobs del TP4** (`build (backend)` y `build (frontend)`), así los required checks de `main` no cambiaron de nombre y el freno quedó puesto solo. A cada Dockerfile le agregué una etapa `test` en el medio, que sale de la etapa de build (mismo código, mismas dependencias) y corre `npm run test:ci`. Por cada componente, el job: construye esa etapa, la corre con `docker run` dejando el reporte en una carpeta compartida, escribe una tabla de cobertura en el resumen de la corrida y sube el reporte HTML como artefacto (`coverage-backend` / `coverage-frontend`). La imagen final sigue sin llevar vitest ni los tests adentro.

El paso del resumen **falla si no hay reporte o si midió 0 líneas**: un 0 de 0 no es "todo cubierto", es que la medición no corrió.

- Corrida con el resumen de cobertura de los dos lados y los reportes descargables: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37968011476

### El PR bloqueado (PR 1): rojo → tests → verde → merge
PR: https://github.com/agustinagonzalezz/ingsoft3-tps/pull/25

1. Agregué `estadoDeEvento` en `rules.ts` (dice si un evento está cobrado, vencido, por vencer, etc.) **sin ningún test**. Compila perfecto y los 56 tests existentes pasan.
2. El check `build (backend)` se puso **en rojo por cobertura**, no por compilación. El log dice: `ERROR: Coverage for lines (85.05%) does not meet global threshold (90%)`. Frenó en **líneas**; las ramas bajaron a 89,33% pero quedaron arriba de 85. Versión: vitest 5.0.3 (desde la 4, una función que nadie llama también resta ramas, por eso bajaron las dos). Como `build (backend)` es required, el PR quedó **BLOCKED**. Corrida roja: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37968865946
3. Escribí **un test por cada camino** que declara la función (sin participantes, cobrado, vencido, vence pronto, pendiente), con los bordes de fecha (el momento exacto del vencimiento, exactamente 3 días, 3 días y un milisegundo). Volvió a 100% y quedó verde: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37989229834
4. Lo mergeé con "merge commit" para que el historial muestre los dos commits: el que dio rojo y el de los tests.

**Por qué no se podía mergear si compilaba y los tests pasaban:** porque la condición del gate ya no es solo "compila y no falla ningún test", sino también "el código nuevo entra testeado". En el TP4 me frenaba la máquina diciendo "esto no anda"; acá me frena un criterio de calidad que elegí yo.

### El PR que queda abierto (PR 2)
PR: https://github.com/agustinagonzalezz/ingsoft3-tps/pull/26 — **queda abierto y en rojo hasta la defensa, no se mergea.**

Desde `main` (ya con el umbral), agregué un solo archivo en el frontend, `recordatorio.ts` (arma el mensaje de recordatorio de pago), sin tests. Esta vez frenó el otro job, `build (frontend)`, y en **las dos métricas**: `lines (73.68%)` contra 90 y `branches (60%)` contra 85. Bajó más porque el frontend es más chico (28 líneas medidas). Corrida roja: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37993039453

### El ejercicio del camino sin cubrir
Después de testear `mappers.ts`, el reporte lo mostraba con 100% de líneas pero **50% de ramas**:
1. **Qué línea es:** `backend/src/mappers.ts`, línea 31 en el commit `580cf55` (hoy está en `toParticipante`): `amountOverride: p.amountOverride?.toNumber() ?? null`. No hay ningún `if` a la vista: las dos ramas las abren el `?.` y el `??`. Mis tests solo pasaban por el caso en que la jugadora tiene un monto personalizado.
2. **Qué entrada la recorrería:** una participante con `amountOverride: null`, o sea, una jugadora que paga el monto normal del evento. En los datos reales es el caso **más común**.
3. **Qué decidí:** agregar el test. Si alguien cambiara `?? null` por `?? 0`, las reglas entenderían "esta jugadora debe $0" y la deuda de casi todo el equipo desaparecería sin ningún error. Lo comprobé haciendo ese cambio a propósito: el test nuevo se puso en rojo (`expected +0 to be null`) y volví el código atrás.

Encontré otro caso igual en `armarCambiosJugadora` (`body ?? {}`): un PATCH sin body. También agregué el test, porque Express 5 deja `req.body` vacío cuando no viene JSON: si alguien sacara ese `??`, la API respondería un error 500.

### Por qué cobertura alta no garantiza calidad (con un ejemplo mío)
Tengo 100% en el backend y aun así hay un problema que ningún test ve: en `armarCambiosJugadora`, `Boolean(active)` convierte el texto `"false"` en `true`. Si alguien manda `{"active": "false"}`, la jugadora queda **activa**. La línea se ejecuta en los tests (por eso cuenta como cubierta), pero ningún test prueba ese valor. Mi front manda booleanos, así que hoy no pasa, pero el número no me lo avisa.

Y un test podría sumar cobertura sin verificar nada: llamar a `calcularDeudaJugadora(...)` sin ningún `expect`. Ejecuta todas las líneas y nunca falla. La cobertura mide qué código **se ejecutó**, no qué **se comprobó**; para saber si los tests comprueban, hay que cambiar el código a propósito y ver si algo se pone en rojo (como hice con el `?? 0`).

### Qué NO cubren mis tests
- La conexión real entre frontend, backend y base (los handlers, Prisma, nginx): TP7.
- Los componentes de React (que el botón se vea deshabilitado, que el contador se actualice en pantalla): TP7.
- El caso `"false"` como texto del punto anterior.
- `traerReal` (el `fetch` real del navegador): testearlo sería testear el navegador.

### Problemas encontrados y cómo los resolví
- **El Dockerfile del backend borraba vitest.** La etapa de build terminaba con `npm prune --omit=dev`, que saca las dependencias de desarrollo (entre ellas vitest). Una etapa de tests que saliera de ahí no hubiera tenido con qué correr. Moví el `prune` a una etapa aparte que solo usa la imagen final.
- **Un bug real que encontré al testear.** La validación del tipo de evento usaba `type in EventType`, y `in` también mira las propiedades heredadas de cualquier objeto: `"constructor"` pasaba como tipo válido y la API respondía 500 en vez de 400. Lo cambié por `Object.hasOwn(EventType, type)` y quedó un test con ese caso.
- **El PR #24 se mergeó con "Squash and merge"** (https://github.com/agustinagonzalezz/ingsoft3-tps/pull/24) y mi rama quedó con una historia distinta a la de `main`. Lo noté porque el push decía `[new branch]` (GitHub había borrado la rama). Comprobé con `git diff` que el contenido era idéntico y moví mi único commit nuevo arriba de `main` con `git rebase --onto`. Desde ahí mergeo con "merge commit".
- **Docker Hub cortó las descargas con `429 Too Many Requests`** en los runners de GitHub (descargan sin login y comparten IP), así que el PR 2 dio rojo en el paso de construir la imagen, antes de correr los tests: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37990283055 . No lo tomé como evidencia del freno. Lo arreglé en un PR aparte bajando las imágenes base desde `mirror.gcr.io` (el espejo de Google, misma imagen oficial): https://github.com/agustinagonzalezz/ingsoft3-tps/pull/27 (corrida verde: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/37992240912). El resumen de cobertura sí detectó bien ese caso: falló con "No se generó reportes/coverage/coverage-summary.json".
- **El YAML del compose quedó mal indentado en un commit** (el healthcheck de postgres). Lo detecté revisando el commit y lo corregí en otro commit.
- **PowerShell se come el `--`** de `npm test -- --run`, y vitest quedaba mirando cambios en vez de terminar. En mi máquina uso `npx vitest run`.
- **`${COVERAGE_DIR:-coverage}` no anda en Windows** (es sintaxis de `sh`). El script `test:ci` es el que corre adentro del contenedor (Linux); en mi máquina corro `npx vitest run --coverage`.

### Declaración de uso de IA
Usé Claude (Anthropic) como asistente durante todo el TP5: para seguir la guía sección por sección y traducir el ejemplo de .NET a mi stack, para los refactors (`marcarPago` con repo inyectado, `request`/`crearApi` con el cliente por parámetro, y sacar la lógica de las rutas a `rules.ts`/`mappers.ts`/`reglas.ts`), para escribir los tests, para los cambios en los Dockerfiles y en `ci.yml`, para diagnosticar los problemas de arriba y para armar este documento.

Cómo lo verifiqué: corrí yo misma cada paso en mi máquina (tests con cobertura, `docker build` de la etapa de tests, `docker compose up` y prueba de cada pantalla después de cada refactor) y revisé cada corrida en GitHub (los logs con el `ERROR: Coverage…`, el estado `BLOCKED` con `gh pr view`, los required checks con `gh api`). Para comprobar que los tests verifican algo de verdad, cambié reglas a propósito y vi que se pusieran en rojo. Puedo explicar qué verifica cada assert y qué casos no están cubiertos (la sección "Qué NO cubren mis tests").


## TP6 - CD: environments, aprobaciones y deployment patterns

### En una frase
Mi pipeline dejó de solo verificar y empezó a **entregar**: cada merge a `main` publica las dos imágenes, se despliega **solo** a QA y se comprueba con un smoke test; a PROD llega el **mismo commit**, pero únicamente después de que yo lo apruebo en GitHub.

### El artefacto: por qué se publica sólo con la verificación en verde
Hasta el TP5, la imagen que construía el CI moría con el runner. Ahora el job publica las dos imágenes en `ghcr.io`, etiquetadas con el commit que las produjo (`sha-<commit>`), y **sólo cuando el cambio entra a `main`**.

Que en el registry haya sólo cosas verificadas no depende de un control nuevo, sino de **tres eslabones** que ya tenía, encadenados:
1. **Nada entra a `main` sin el pipeline en verde** (los required checks del TP4 + el umbral de coverage del TP5).
2. **Sólo `main` publica**: el login al registry tiene `if: github.event_name == 'push'` y el `push:` del build exige además `github.ref == 'refs/heads/main'`. En un PR el job construye igual (así verifica el Dockerfile) pero no sube nada: «Entrar al registry» sale salteado (enlace 1).
3. **Publicar es el último paso del mismo job que corrió los tests.** No hay ningún `if` que diga «si los tests pasaron»: los pasos corren en orden y el job se corta en el primer error, así que si los tests fallan nunca se llega a publicar (enlace 2). Por eso moví el build final, que en el TP4 estaba **antes** de los tests, al final del job.

Si se publicara igual con los tests en rojo, «estar en el registry» dejaría de querer decir «pasó la verificación» y pasaría a ser un depósito de cosas que alguien construyó alguna vez.

**Lo que esta cadena NO garantiza:** que no entre nada más al registry. Yo podría hacer `docker push` desde mi notebook con mis credenciales y nadie me lo impide; la cadena garantiza lo que publica **el pipeline**, no todo lo que físicamente puede entrar. Además, un tag como `sha-4cfaaeb…` se puede volver a pisar con otra imagen: lo que identifica a una imagen de forma que no se puede cambiar es su **digest** (`sha256:…`, el que muestra `docker pull`). Tampoco garantiza que lo que corre en Render sea esa imagen (ver «Qué garantía pierdo porque Render reconstruye»).

El permiso para publicar (`packages: write`) lo puse **dentro del job** y no a nivel del workflow: así lo tiene sólo el job que publica (mínimo privilegio). No hizo falta ningún secret: alcanza con el `GITHUB_TOKEN` que GitHub le da a cada corrida.

### Continuous Delivery, no Continuous Deployment
- **CI** (TP4/TP5): cada cambio se integra y se verifica.
- **Continuous Delivery** (lo que implementé): cada cambio verificado llega solo a QA y queda **listo** para PROD, pero el último paso lo autoriza una persona.
- **Continuous Deployment**: todo lo que pasa las verificaciones llega solo a PROD, sin humano.

Elegí Continuous Delivery porque mi red de seguridad todavía no alcanza para sacar al humano: tengo tests unitarios con buena cobertura, pero no tengo tests de punta a punta (vienen en el TP7) ni monitoreo de errores en PROD. Con Continuous Deployment, un bug que los tests no ven llegaría solo a producción. Y la app maneja **plata** (cobros y gastos del equipo), así que prefiero que alguien mire antes. Para pasar a Continuous Deployment me faltaría: tests de punta a punta contra QA, métricas de errores en PROD y un rollback automático si esas métricas empeoran.

### Dos entornos reales: proveedor y cómo cumplo el contrato
Usé el riel de la guía: **Render** para correr los contenedores y **Neon** para la base de datos (no el Postgres de Render, porque el gratuito se borra a los 30 días y no llega a la defensa).

| Punto del contrato | Cómo lo cumplo |
|---|---|
| Dos entornos separados con URL pública | 4 servicios en Render: `teampay-api-qa`, `teampay-front-qa`, `teampay-api-prod`, `teampay-front-prod` |
| Una base por entorno | Dos databases en Neon: `app_qa` y `app_prod`. Cada api recibe la suya en `DATABASE_URL` |
| Front y back como contenedores, desde mis Dockerfiles | Los 4 servicios con runtime **Docker** (Render construye la última etapa: `runtime`) |
| El deploy lo dispara mi pipeline, con el commit verificado | **Auto-Deploy en Off** en los 4. El pipeline llama a los *deploy hooks* con `&ref=$GITHUB_SHA` |
| PROD detrás de la aprobación | El job `deploy-prod` usa `environment: production`, que tiene required reviewer |

**Las tablas.** Las dos bases nacen vacías. Mi `docker-entrypoint.sh` corre `prisma migrate deploy` antes de levantar la API, así que las tablas se crearon solas la primera vez que cada api arrancó en Render. Lo comprobé en el SQL Editor de Neon con `SELECT count(*) FROM "Player";` en las dos bases: antes daba *relation does not exist*, después dio 0. (Con comillas y mayúscula: Prisma crea las tablas con el nombre del modelo.)

**Cómo comprobé que cada entorno usa su propia base.** Las dos `DATABASE_URL` difieren en una sola palabra (`app_qa` / `app_prod`), y si las cruzo nada se pone rojo: PROD funcionaría escribiendo en la base de QA. Mirar las variables en Render no alcanza; hay que probarlo con un dato. Desde el SQL Editor de Neon, con **`app_prod`** seleccionada, creé una jugadora con un nombre inconfundible:

```sql
INSERT INTO "Player" ("id", "name") VALUES ('solo-prod-1', 'SOY PROD');
```

(El `id` va a mano porque en mi tabla lo genera Prisma desde el código, no la base.) Después le pregunté a cada api:

| | `GET /api/jugadoras` |
|---|---|
| PROD | `[{"id":"solo-prod-1","name":"SOY PROD",…}]`: aparece |
| QA | `[{"id":"cmv8…","name":"AGUSTINA GONZALEZ ALONSO",…}]`: **no** aparece (sólo la jugadora que creé desde el front de QA en las pruebas) |

Cada api lee de su base. Dejé `SOY PROD` en PROD para poder repetir la prueba en vivo.

### Qué quedó por variable y qué quedó adentro de la imagen
| Por variable de entorno (cambia por entorno) | Adentro de la imagen (igual en QA y PROD) |
|---|---|
| `BACKEND_URL`: a qué api le habla el front | El código compilado del backend y el `dist/` del front |
| `DNS_RESOLVER`: con qué DNS nginx busca esa api | La plantilla de nginx (`default.conf.template`) |
| `DATABASE_URL`: a qué base se conecta la api | Las migraciones de Prisma |
| `PORT`: lo pone Render | Los valores por defecto de compose (`backend:8080`, `127.0.0.11`) |
| `RENDER_GIT_COMMIT`: qué commit corre (lo pone Render) | |

El `nginx.conf` del TP2 tenía `http://backend:8080` **escrito adentro**. Lo convertí en una plantilla: la imagen oficial de nginx, al arrancar, toma los archivos de `/etc/nginx/templates/`, reemplaza `${BACKEND_URL}` y `${DNS_RESOLVER}` por las variables del entorno y deja el resultado en `conf.d/`. Así **la misma imagen** del front sirve en QA y en PROD, y cada una habla con su api. Mi `docker compose up` sigue andando igual porque el Dockerfile deja como valores por defecto los de compose. Esto es lo que hace posible el TP7: desplegar la misma imagen en los dos entornos.

### El diseño de la cadena: `needs`, `if` y environments
```
build (matriz: backend, frontend)   tests + coverage + publicar la imagen
  └─ deploy-qa      needs: build · if: push a main · environment: qa
       └─ deploy-prod   needs: deploy-qa · environment: production (required reviewer) · concurrency: deploy-prod
```
- **`needs`** arma la cadena con compuertas: sin los dos builds en verde no hay deploy a QA, y sin QA desplegado y con su smoke en verde no hay deploy a PROD.
- **`if`**: los PRs verifican pero no despliegan. `deploy-prod` **no repite el `if`** a propósito: depende de `deploy-qa`, que sí lo tiene, así que en un PR los dos salen salteados.
- **`environment`**: conecta el job con el environment de GitHub. De ahí saca sus secrets, ahí quedan registrados los deploys (*Deployments*), y en `production` es donde el workflow **se pausa** hasta la aprobación.
- **`&ref=$GITHUB_SHA`**: el hook pelado despliega la punta de `main`, no el commit que el pipeline verificó. Con `&ref` cada corrida despliega **su** commit. Lo vi en la práctica: re-corrí una corrida vieja (la del commit `2295e23`) cuando `main` ya estaba en `a451d35`, y QA quedó en `2295e23`, el que esa corrida había verificado. Sin `&ref`, esa corrida habría desplegado `a451d35`, que ella nunca verificó. En PROD importa todavía más: entre que una corrida queda esperando aprobación y que la apruebo pueden pasar horas, y `main` se mueve.
- **`concurrency: deploy-prod`**: nunca corren dos deploys a PROD a la vez. Pero no ordena la cola de aprobaciones: si quedan dos corridas esperando y apruebo la vieja, PROD **retrocede**. La regla es mía: la corrida vieja se rechaza a mano.

### El alcance de cada secret
| Secret | Dónde vive | Quién lo puede leer |
|---|---|---|
| `GITHUB_TOKEN` | Lo genera GitHub en cada corrida | El job que corre, mientras dura |
| `RENDER_HOOK_API_QA`, `RENDER_HOOK_FRONT_QA` | Environment `qa` | Sólo un job con `environment: qa` |
| `RENDER_HOOK_API_PROD`, `RENDER_HOOK_FRONT_PROD` | Environment `production` | Sólo un job con `environment: production`, **y recién después de que lo apruebo** |
| `DATABASE_URL` de cada entorno | En Render, en el servicio | Nunca pasa por GitHub |

Un deploy hook es una URL que, al llamarla, despliega ese servicio: **quien la tiene, despliega mi app**. Por eso los de PROD viven dentro de su environment y no en el repo: si estuvieran en el repo, cualquier job (incluido uno que alguien agregue en un PR) podría leerlos y desplegar a producción sin pasar por la aprobación. Los cargo con `gh secret set … --env <entorno>` y nunca con el valor escrito en el comando, para que no quede en el historial de la terminal.

### El smoke test: qué prueba y qué no
Después de disparar el deploy, el job prueba el entorno **30 veces cada 20 segundos** (unos 10 minutos). Reintenta porque el hook contesta al instante pero Render construye en segundo plano, y el free tier tiene cold start: un `curl` seco daría rojos falsos. Cada `curl` tiene `--max-time 10`, porque un servicio que se está despertando acepta la conexión y no contesta.

Da verde sólo si se cumplen las cuatro:
1. `api/health` contesta y dice que corre **el commit que se verificó** (`RENDER_GIT_COMMIT`).
2. `api/jugadoras` contesta: la base responde. Un `/health` que no toca la base daría verde con la `DATABASE_URL` rota.
3. El front contesta.
4. `front/api/health` contesta: el camino front → nginx → api funciona.

El punto 1 lo agregué porque la guía avisa que, mientras Render construye la versión nueva, **sigue sirviendo la vieja**, y el smoke daría verde contra esa.

**Lo que NO prueba:**
- **Qué versión del front corre.** El commit lo compruebo sólo en la api. Me pasó: en el primer deploy aprobado a PROD el smoke dio verde en 3 segundos porque la api ya tenía el commit nuevo, pero el front todavía se estaba construyendo y seguía sirviendo el título viejo.
- **Que la app funcione para el usuario.** No crea ni lee datos de verdad, no prueba pantallas ni reglas de negocio.
- **Que no haya errores después.** Mira un instante; si la app empieza a fallar cinco minutos más tarde, el job ya terminó en verde.

### El gate: qué miro antes de aprobar
Antes de aprobar un deploy a PROD miro:
1. Que `deploy (qa)` haya terminado en verde y **en cuántos intentos** dio verde el smoke (si tardó mucho más que lo normal, algo raro pasa).
2. **Qué cambia** este deploy: el PR y su diff.
3. **El cambio funcionando en QA**: abro el front de QA y lo veo con mis ojos.
4. Que no haya otra corrida más nueva esperando aprobación (si la hay, rechazo la vieja).
5. Si el cambio toca la base (una migración): ahí no apruebo sin antes pensar cómo volvería atrás, porque el rollback no deshace los datos.

**Lo que mi aprobador NO puede ver:** cómo se comporta el cambio con datos y usuarios reales (QA tiene datos de prueba), si hay errores en PROD en este momento, ni la latencia o el uso de memoria. Para decidir mejor me falta observabilidad: logs centralizados, una tasa de errores por versión y alertas.

**El rechazo** (la evidencia que pide el TP): https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/38756661281. Rechacé esa corrida porque sólo agregaba el job de PROD y los hooks de producción los había cargado minutos antes: antes de mandar algo a PROD quería comprobar en Render que los hooks apuntaban a los servicios `-prod` y no a los de QA. El run quedó en *failure* en el job de PROD: la máquina obedeció al humano.

**La aprobación**: https://github.com/agustinagonzalezz/ingsoft3-tps/actions/runs/38765398700 (el título del encabezado pasó de `tp-inge3` a `TeamPay mini`, y se ve en el front de PROD).

Me equivoqué dos veces con los comentarios de aprobación: en una pegué el ejemplo que tenía a mano sin completar el dato (decía «en N intentos») y en otra aprobé sin comentario. Una aprobación sin criterio escrito es justo lo que la teoría llama teatro. Por eso escribí acá arriba qué miro.

### La letra chica del free tier y cómo la maneja mi pipeline
- **Render duerme cada servicio a los 15 minutos sin tráfico** y despertarlo tarda hasta un minuto (cold start). Lo viví dos veces: un 502 y un 429 en el front, porque la api estaba dormida. Mi smoke lo maneja con reintentos y con `--max-time` en cada pedido.
- **750 horas de instancia por mes, para todo el workspace** (no por servicio). Con 4 servicios que duermen cuando no se usan, no llego. No dejo nada haciendo «ping» para mantenerlos despiertos, porque eso sí se comería las horas.
- **500 minutos de build por mes en el workspace.** Cada promoción completa son hasta 4 builds (api y front, en QA y en PROD); en mis deploys cada build tardó entre 30 segundos y 1,5 minutos, o sea unos 3–5 minutos por promoción. Si se acaban, Render deja de construir hasta fin de mes **y el hook responde igual**: sin el chequeo del commit, el smoke daría verde contra la versión vieja. Con el chequeo, el job falla.
- **Neon** suspende la base a los ~5 minutos sin uso (se despierta sola y rápido) y tiene 0,5 GB de almacenamiento.

### Qué garantía pierdo porque Render reconstruye
Mi pipeline publica la imagen que pasó los tests, pero **Render no la usa**: el hook le pide que vuelva a construir ese commit desde el repositorio. Entonces promuevo **el mismo commit**, pero no **la misma imagen**. Lo que corre en QA y en PROD es otra construcción del mismo código, y podría salir distinta: una dependencia que se resolvió diferente, una imagen base (`node:22-alpine`, `nginx:1.29-alpine`) que se actualizó entre un build y otro. Además, QA y PROD son **dos construcciones distintas** entre sí: lo que probé en QA no es, literalmente, lo que corre en PROD. Es exactamente lo que resuelve el TP7, desplegando la imagen del registry.

### Release
La llegada a PROD quedó etiquetada como **`v6.0.0`** y publicada como Release de GitHub con notas generadas desde los PRs. El tag apunta al commit que corre en PROD **según *Deployments***, no a la punta de `main`: entre la aprobación y el tag podría haber entrado otro merge que nadie aprobó. El número no lo elegí: `v6.0.0` es la marca de cierre del TP6 (no es SemVer).

Primero puse `v6.0.0` en `4cfaaeb` (PR #34), que era lo que había llegado a PROD. Pero en ese commit todavía no estaba esta sección de `decisiones.md`, así que haciendo `git checkout v6.0.0` no se veía. Por eso, después de mergear este archivo, aprobé ese deploy a PROD y **moví el tag** a ese commit (borré la release y el tag y los volví a crear). Así `v6.0.0` sigue siendo exactamente lo que corre en PROD, y además trae la documentación completa.

### Deployment pattern para una producción real: blue-green
Hoy Render hace *recreate*: construye la versión nueva y recién cuando está lista cambia el tráfico. Para TeamPay con usuarios reales elegiría **blue-green**:
- **Por qué ese:** tener dos entornos completos y cambiar el tráfico de uno al otro me da un **rollback instantáneo** (volver el switch). Como la app maneja cobros, prefiero poder volver en segundos antes que ahorrar.
- **Costo:** el doble de infraestructura mientras conviven las dos versiones. Para una app de un equipo deportivo es poco (dos servicios chicos más).
- **Riesgo:** la base es una sola para azul y verde, así que los cambios de esquema tienen que ser compatibles con las dos versiones (primero agregar la columna nueva, después dejar de usar la vieja, y recién en un deploy posterior borrarla).
- **Por qué no canary:** canary necesita **mucho tráfico** para que un porcentaje chico diga algo, y **métricas** que avisen si el canario falla. Un equipo tiene pocas personas usando la app, y hoy no mido errores por versión.
- **Qué observabilidad me falta para ejecutarlo:** tasa de errores y latencia por versión, logs centralizados y alertas. Sin eso, decidir cuándo pasar el tráfico de azul a verde sería a ojo.

Lo combinaría con **feature flags** para las funciones nuevas: desplegar el código apagado y prenderlo después (*deploy ≠ release*). Por ejemplo, un flag para el recordatorio de pago: lo prendo primero sólo para mi usuario de prueba y, si anda, para todo el equipo; si algo sale mal, apago el flag en segundos sin redesplegar.

### Plan de rollback actual (medido)
Si el deploy aprobado sale mal:
1. Busco el último commit bueno: el de la última release (`git rev-list -n1 v6.0.0`) o el anterior en *Deployments → production*.
2. Copio los dos deploy hooks de PROD de Render (los secrets de GitHub no se pueden volver a leer) y los cargo en PowerShell con `Read-Host -AsSecureString`, para que no queden ni en pantalla ni en el historial.
3. Anoto la hora y llamo a los dos hooks con `&ref=<commit bueno>`.
4. Espero a que Render → *Deploys* muestre ese commit **Live** en los dos servicios. No me guío por `/health` ni por la página, porque mientras Render construye sigue sirviendo la versión mala.
5. Compruebo el front de PROD (con Ctrl+F5, porque el navegador guarda el `index.html` viejo).

**Lo medí una vez, de verdad.** Llevé a PROD un cambio visible (el subtítulo del Dashboard, commit `c7f479f`) y volví a `4cfaaeb`, que en ese momento era la release `v6.0.0`:

| | Hora |
|---|---|
| Llamé a los hooks (`Get-Date`) | 18:07:42 |
| api PROD: deploy `dep-db8k17vavr4c73fsvkvg`, empezó 18:07:43, duró 54,2 s | Live ≈ 18:08:37 |
| front PROD: deploy `dep-db8k18e89jmc738b6hv0`, empezó 18:07:46, duró 31,0 s | Live ≈ 18:08:17 |

**El rollback tardó unos 55 segundos**, desde que llamé a los hooks hasta que el último servicio quedó Live. A eso hay que sumarle lo que tardo en darme cuenta del problema y en copiar los hooks, que fueron unos minutos. Es la métrica DORA de **tiempo de recuperación** (MTTR).

Uso el mismo mecanismo que para desplegar (el hook con `&ref`), no el botón *Rollback* de Render: así el procedimiento no depende de una función propia del proveedor.

**Lo que el rollback NO deshace: los datos.** En el log de la api se ve `No pending migrations to apply`: volví el **código**, pero la base quedó como estaba. Esta vez no importaba porque entre las dos versiones no hubo migraciones. Pero si la versión mala hubiera borrado una columna, volver el código no la recupera. Para eso haría falta: migraciones compatibles hacia atrás (agregar antes que borrar) y un backup de la base antes de cada deploy que migre (Neon permite restaurar la base a un momento anterior).

**Otra cosa que el rollback no actualiza:** como lo hice llamando a los hooks desde mi terminal y no desde el pipeline, *Deployments → production* en GitHub sigue diciendo que en PROD está `c7f479f`, cuando en realidad volvió a `4cfaaeb`. El historial de GitHub sólo registra lo que despliega el pipeline. La forma de que quede registrado es re-correr desde *Actions* el job `deploy-prod` de la corrida del commit bueno (que vuelve a pedir aprobación), con el límite de que GitHub sólo deja re-correr corridas de hasta 30 días.

### Herramientas que usé, por fila de la tabla «Tu stack y tu nube»
| Lo que había que lograr | Lo que usé |
|---|---|
| Publicar la imagen desde el pipeline | `docker/build-push-action` → `ghcr.io` |
| Que sólo la rama principal publique | `if: github.event_name == 'push'` + `push: … && github.ref == 'refs/heads/main'` |
| Etiquetar con el commit | `:sha-${{ github.sha }}` |
| Un entorno con su propia configuración | environments `qa` / `production` de GitHub |
| Que el deploy lo dispare el pipeline | deploy hook de Render con `&ref=$GITHUB_SHA` |
| Un gate humano antes de producción | required reviewer en `production` (yo, con *Prevent self-review* desactivado) |
| Secrets con alcance de entorno | environment secrets (`gh secret set --env`) |
| Una base por entorno | dos databases en Neon |
| Crear el esquema en cada base | `prisma migrate deploy` en el `docker-entrypoint.sh` |
| Smoke post-deploy con reintentos | `curl` en loop, 30 × 20 s |
| Release versionada con notas | `gh release create v6.0.0 --generate-notes --verify-tag` |
| Pasarle la conexión a la app | `DATABASE_URL` (URI `postgresql://…`, sin pooling y sin `channel_binding`) |
| Endpoint «estoy vivo» | `/api/health` (devuelve también el commit) |
| Endpoint que toca la base | `/api/jugadoras` |
| Servir el front construido | nginx con el `dist/` de Vite |
| Que el front sepa dónde está su backend | plantilla de nginx con `BACKEND_URL` |

### Problemas encontrados y cómo los resolví
- **El front se caía al arrancar en Render (`Exited with status 1`).** El `nginx.conf` del TP2 tenía `proxy_pass http://backend:8080` escrito fijo. nginx busca la dirección de ese nombre **al arrancar**, y en Render no existe ningún `backend`: `host not found in upstream "backend"`. La guía decía que en este punto el front «abre pero la lista da error», pero en mi app ni arrancaba. Lo resolví adelantando la plantilla del §3.3, que usa `resolver` + una variable: así nginx busca la dirección en cada pedido y no al arrancar.
- **Saqué el `proxy_set_header Host $host`** que tenía en el TP2: Render decide a qué servicio mandar cada pedido mirando el `Host`, y tiene que llegar el de la api, no el del front.
- **Un 502 y después un 429 en el front.** Las dos veces la api estaba dormida por el free tier. Cuando la abrí directo y se despertó, el front anduvo. Es la razón por la que el smoke reintenta.
- **El deploy a QA fallaba con `curl: (3) URL rejected` y el log no decía por qué**, porque GitHub oculta los secrets. Agregué al workflow una validación que revisa cada hook **sin mostrarlo** (vacío, con espacios, o sin la forma `https://api.render.com/deploy/srv-…?key=…`) y dice cuál está mal. Ahí apareció la causa: **al cargar los secrets, el portapapeles no tenía el hook**. Copiaba el hook en Render, después copiaba el comando del chat para pegarlo en PowerShell, y esa segunda copia pisaba la primera. Lo resolví con `Read-Host`: primero ejecuto el comando, y recién después copio el hook y lo pego en el prompt. Antes de guardarlo compruebo que empiece con `https://api.render.com/deploy/srv-` y tenga `?key=`.
- **El primer deploy aprobado a PROD falló: `RENDER_HOOK_FRONT_PROD está vacío`.** Me había faltado cargarlo en el environment `production`. Gracias a la validación, el error lo decía con nombre y apellido. Lo cargué y re-corrí el job (que volvió a pedir aprobación, porque es un deploy a producción).
- **Después del deploy, PROD seguía mostrando el título viejo.** Render ya tenía el commit nuevo en Live: era el navegador mostrando el `index.html` que tenía guardado. Con Ctrl+F5 apareció el nuevo.
- **Al cargar los hooks con `Read-Host` quedaron visibles en la pantalla de la terminal.** Para el rollback usé `Read-Host -AsSecureString`, que no los muestra.

### Declaración de uso de IA
En este TP usé Claude (asistente de IA) como guía, siguiendo la guía de la cátedra sección por sección. La IA escribió los cambios de código y de configuración (los jobs de `ci.yml`, la plantilla de nginx, el `commit` en `/api/health`, la validación de los hooks) y armó los PRs; también me ayudó a diagnosticar los problemas de arriba y a redactar este archivo a partir de lo que fuimos haciendo.

Lo hice y verifiqué yo: crear las cuentas y los 4 servicios en Render y las 2 bases en Neon, cargar las variables y los secrets, hacer públicos los paquetes y comprobarlos con `docker pull` sin credenciales, mergear cada PR, mirar cada corrida en *Actions*, rechazar y aprobar los deploys a PROD, crear el tag y la release, y hacer y cronometrar el rollback. De cada cambio pedí que me explicaran qué hace y por qué está ahí, y lo comprobé en el resultado: el paso salteado en el PR, el commit en Render → *Deploys*, el título y el subtítulo cambiando en QA y en PROD, y las horas del rollback en Render.

## TP7 - Contenedores en el pipeline + integración y e2e

### En una frase
Lo que se prueba es lo que se despliega: el pipeline construye las dos imágenes **una sola vez**, QA y PROD **ejecutan esas mismas imágenes** (Render ya no compila nada), y antes de pedirme la aprobación para PROD, una prueba de integración le habla a la api de QA con su base de verdad y un navegador de verdad usa la app completa. Si cualquiera de las dos falla, PROD ni se entera.

### Build once, deploy many: qué problema del TP6 resuelve
En el TP6 promovía un **commit**: el hook le decía a Render «construí este commit», y Render lo compilaba desde el repo. Lo dejé anotado como limitación: la imagen que pasó mis tests se publicaba en `ghcr.io` y **nadie la usaba**. Lo que corría en QA era otra construcción del mismo código, y lo que corría en PROD era **una tercera**, hecha más tarde.

Un ejemplo concreto de mi app: mis Dockerfiles arrancan `FROM …/nginx:1.29-alpine` y `FROM …/node:22-alpine`. Esas etiquetas se mueven: cuando sale un parche, `nginx:1.29-alpine` pasa a ser otra imagen. Si entre el build de QA y el de PROD salía un parche, PROD corría con un nginx que nadie probó. Fijar la versión achica el problema, pero no lo cierra: sigo construyendo dos veces y no puedo demostrar que salió lo mismo.

Ahora el deploy dice **qué imagen ejecutar** (`imgURL=…:sha-<commit>`), y es la misma en QA y en PROD. Lo que aprobé en QA es, byte por byte, lo que corre en PROD. Y volver atrás es pedirle al hook una imagen anterior, que sigue intacta en el registry: no hay que reconstruir nada.

### Mis etiquetas: `sha-<commit>` en el registry, `v7.0.0` en git
- **`sha-<commit>`** (los 40 caracteres): dice **de qué commit salió** la imagen. Es la que uso para promover, porque se arma sola con el commit de la corrida (`${{ github.sha }}`): en el mismo YAML, QA y PROD reciben exactamente la misma.
- **`v7.0.0`** es un tag de **git**, no de la imagen: le pone **nombre** a la versión que sé que anduvo en PROD. Va sobre el commit que dice *Deployments* del environment `production`, no sobre el último de `main`.
- **Por qué no publico `latest`:** `latest` es un puntero que se mueve con cada merge; no dice qué contenido hay detrás. Si algún deploy dijera `latest`, ejecutaría «lo último que se publicó», haya pasado las pruebas o no, y después no podría decir qué desplegué. En mi registry cada imagen tiene un solo nombre: el de su commit.
- **Lo que un tag NO garantiza:** las etiquetas se pueden volver a publicar. Si alguien re-corre la corrida de un commit viejo, el job `build` vuelve a publicar `sha-<ese commit>` con una imagen nueva (otra construcción). Mi `imgURL` por etiqueta desplegaría ese contenido nuevo, que no es el que probé. Lo único que no se mueve es el **digest** (`@sha256:…`, la huella del contenido), que el hook también acepta. No lo uso porque se conoce recién después de construir y habría que pasarlo de job en job; a cambio, tengo una regla: **una corrida vieja no se re-corre para desplegar**.

**Con qué imagen configuré los servicios de Render, y por qué no es ésa la que corre.** A los cuatro servicios les **cambié la fuente** a *Existing Image* (no creé servicios nuevos, así conservé las URLs, las variables, los hooks y el historial). Render pide una imagen para hacer el cambio, y le di la del último merge del TP6: `sha-2a25b60…`. Ésa es sólo el punto de partida. Lo que corre lo decide cada deploy del pipeline con su `imgURL`; Render sólo exige que coincida el nombre de la imagen, y la etiqueta puede ser otra. Por eso *Settings* sigue diciendo `2a25b60` aunque QA y PROD corran algo más nuevo, y por eso **nunca uso *Manual Deploy***: ese botón despliega la imagen de *Settings*, y me llevaría el entorno para atrás sin avisar.

### De la release a la imagen, en un paso
`git rev-list -n1 v7.0.0` me da el commit, y mi pipeline publicó las dos imágenes de ese commit con su nombre: `ingsoft3-tps-backend:sha-<commit>` e `ingsoft3-tps-frontend:sha-<commit>`. Para volver a esa versión, le mando esas dos imágenes a los hooks: es el mismo mecanismo del deploy.

### Cómo compruebo desde afuera que un entorno ejecuta mi imagen
1. **En *Events* de cada servicio de Render**, el deploy dice «Triggered via Deploy Hook» y nombra la imagen `…:sha-<commit>` de esa corrida, y esa etiqueta está en mis paquetes. Si alguien desplegara a mano desde el panel, ese deploy no diría «Triggered via Deploy Hook» y no habría corrida que lo respalde. (*Events* no es público: lo muestro en vivo en la defensa.)
2. **Además, mi smoke lo comprueba solo.** En el TP6 la api devolvía el commit en `/api/health` sacándolo de `RENDER_GIT_COMMIT`, una variable que Render pone **sólo cuando construye desde el repo**. Con *Existing Image* esa variable desaparece, y mi smoke se hubiera quedado esperando para siempre. Lo resolví **horneando el commit en la imagen**: el pipeline le pasa `GIT_COMMIT` al construir (`build-args`), el Dockerfile lo guarda como variable de entorno en la última etapa, y la api lo devuelve. El smoke compara ese valor con el commit de la corrida: si el deploy falló y Render sigue sirviendo la imagen anterior, la api contesta el commit viejo y **el smoke da rojo**. La guía deja esto como «el paso siguiente» (§2.4); en mi pipeline ya estaba el chequeo, así que lo mantuve.

   Puse el `ARG` al final de la última etapa a propósito: si estuviera arriba, cada commit nuevo invalidaría la cache de `npm ci`, del build y de los tests.

**Lo que el smoke NO prueba:** que la app **funcione**. Pregunta «¿respondés, y con qué commit?»: la api, la base (`/api/jugadoras`) y el front. Un botón que no hace nada, o un campo que el front manda con otro nombre, pasan el smoke. Eso es lo que ven la integración y la e2e. Y el commit que devuelve la api dice de qué commit salió la imagen, no que sea **ese contenido exacto** (para eso haría falta el digest, por lo mismo de arriba).

### Las dos suites: qué elegí y por qué
Elegí **Eventos** como dato principal porque es lo que se puede crear **y borrar**. Las jugadoras no tienen `DELETE` en mi api: una prueba que creara jugadoras dejaría basura en QA en cada corrida. Todas las pruebas se fabrican un nombre que no se repite (con la hora adentro), borran lo que crean y comprueban que ya no está. Si una falla a la mitad, un `afterEach` borra igual lo que haya quedado.

**Integración** (`frontend/e2e/api.spec.ts`, 4 pruebas, sin navegador, contra la api de QA):

| Prueba | Por qué |
|---|---|
| Alta → aparece en el `GET` → borrado → ya no aparece | La pedida (a). El `GET` le pregunta a la base, no a un doble |
| Evento sin nombre → 400 y no se creó nada | La pedida (b) |
| **Monto de 1.000.000.000 → 400 y no se creó nada** | La elegí porque **encontró un bug real** (abajo) |
| Cobro: marcar un pago → no se puede borrar el evento (409) → desmarcar → ahora sí | El flujo que pasa por tres tablas y por la regla 3 |

**E2E** (`frontend/e2e/eventos.spec.ts`, 3 flujos con Chromium, contra el front de QA):

| Flujo | Qué hace |
|---|---|
| Creación | Crea un evento, lo ve, **recarga** y sigue ahí (lo guardó la base), lo elimina, recarga y no está |
| Error | Monto demasiado grande: la persona **ve el mensaje** (`role="alert"`) y el evento no aparece |
| El de todos los días: cobrar una cuota | Tilda el pago de una jugadora, ve «1 pagaron», el botón Eliminar desaparece, recarga y el pago sigue tildado; después lo destilda y elimina el evento |

**Por qué el cobro es mi tercera de las dos suites:** es para lo que existe la app. Si mañana no se puede marcar que una jugadora pagó, la que me escribe es la tesorera del equipo, el día que junta la cuota. Además toca la base (tres tablas) y una regla de negocio.

**Qué NO puse, y por qué (la pirámide):**
- **En e2e no puse** el cálculo de la deuda, el balance del dashboard, ni cada validación de cada campo: son reglas que ya prueban los unitarios del TP5 en milisegundos, con todos sus casos y bordes. La e2e es cara y lenta; va sólo lo que, si se rompe, la app no sirve.
- **En integración no puse** cada combinación de datos inválidos (tipo inexistente, fecha mal escrita…): eso lo decide `validarNuevoEvento`, que es pura y tiene sus unitarios. Acá va lo que sólo se ve **con la base de verdad**: que se guarda, que se borra, y lo que Postgres acepta o rechaza.
- **En ninguna de las dos** puse jugadoras ni eximir: jugadoras no se pueden limpiar (no hay `DELETE`), y eximir es una regla con su unitario.

### El bug que encontró la integración
Escribiendo la tercera prueba de integración, crear un evento con monto 1.000.000.000 hacía que la api contestara **500 Error interno**. La columna `amount` es `Decimal(10, 2)` en `schema.prisma`: entra hasta 99.999.999,99, y con más, **Postgres rechaza el INSERT**. Ningún test lo veía:
- Los **unitarios del TP5** no tienen base: la regla sólo pedía monto > 0, y con un doble el «guardado» siempre sale bien.
- El **front** lo deja enviar, por la misma regla.

Lo arreglé con una regla nueva en `rules.ts` (`MONTO_MAXIMO`, con dos unitarios: uno que rechaza el monto de más y otro que acepta el borde exacto), y ahora la api contesta **400** con el motivo. Es mi respuesta a «dame un cambio que sólo la integración atraparía»: si alguien sube `MONTO_MAXIMO` sin cambiar la columna, los unitarios siguen verdes y la integración se pone roja.

### Qué pruebo en integración y qué en e2e, y el par verde/rojo
- **Integración:** que mi api desplegada y su base se entienden. Le habla directo a la api, sin pantalla. No puede ver si la pantalla usa bien esos endpoints.
- **E2E:** que una persona puede usar la app. Pasa por todo (nginx del front, la api, la base), pero cuando falla no dice **quién** se rompió.

Juntas dan un diagnóstico. Para la evidencia rompí **el front**: cambié el texto del botón de «Crear evento» a «Agregar evento» (PR #40, una línea en `EventoForm.tsx`, sin tocar `e2e/`). La corrida quedó así:

| Capa | Resultado |
|---|---|
| Unitarios (TP5) | 🟢 ninguno mira el texto de un botón |
| Smoke | 🟢 la api y el front respondían |
| **Integración** | **🟢** |
| **E2E** | **🔴** |
| `deploy (production)` | salteado: ni pidió aprobación |

**Cómo lo leí, con los reportes y sin abrir el código.** Bajé los dos artefactos de esa corrida. El de integración, en verde: la api creó, guardó, rechazó y borró eventos con la base de QA. **La api y la base están sanas.** El de e2e, en rojo: los tres tests fallaron esperando `getByRole('button', { name: 'Crear evento' })`; la captura muestra el formulario lleno con un botón que dice «Agregar evento», y en la traza, la pestaña *Network* muestra el `GET /api/eventos` contestando 200. **El que se rompió es el front: la pantalla ya no tiene el botón que una persona usa para crear un evento.** Es la fila 1 de la tabla de §2.5. Lo arreglé (PR #41), la cadena completa quedó verde, aprobé, y PROD recibió la misma imagen que verificó QA.

Lo que **no** pasó gracias al gate: el botón cambiado nunca llegó a PROD. PROD siguió con `c19c6b4` hasta que llegó el arreglo.

**Si hubiera roto la api** (por ejemplo, que contestara 500 al crear), la integración se habría puesto roja y la e2e **no habría corrido**, porque su `needs: integracion` no se cumple. Fila 2: el problema está en la api o en la base, y no se gasta un navegador en confirmarlo.

### Por qué mi integración es la amplia y no la estrecha
Hay dos formas de escribirla:
- **Estrecha:** levantar la api dentro del pipeline, con un Postgres descartable como `services:` del job. Llega **antes** (no necesita deploy) y está **aislada**: ninguna otra corrida la toca.
- **Amplia (la mía):** la api **ya desplegada** en QA, con su base de verdad. Prueba además que **el deploy quedó bien**: que la imagen arrancó, que corrió las migraciones, que la `DATABASE_URL` de QA apunta a una base que existe. Y no tuve que armar nada: QA ya corre la imagen exacta de esta corrida.

Lo que pierdo: llega más tarde (después del deploy), depende de que QA esté despierto, y comparte la base con las otras corridas (límite conocido, abajo). Elegí la amplia porque ya tenía QA, y con un décimo de la configuración pruebo el mismo concepto más el deploy.

### Cold start del free tier y tests flaky
QA duerme después de 15 minutos sin uso y tarda hasta un minuto en despertar. Lo manejo sin `sleep`s:
- **El smoke de `deploy-qa` lo despierta antes**: reintenta 30 × 20 s hasta que la api contesta el commit nuevo. Cuando arrancan las pruebas, QA ya está despierto.
- **Timeouts largos** en `playwright.config.ts`: 60 s por test y 15 s por aserción (el default es 5 s). Playwright **espera solo** a que aparezca lo que busca, y reintenta la aserción hasta ese tope.
- **Un reintento** (`retries: 1`), para una demora suelta de la red.
- **De a un test por vez** (`workers: 1`): QA es uno solo, y dos tests en paralelo podrían verse los datos entre sí.

**Un test flaky** es el que a veces pasa y a veces falla sin que cambie el código. Es peor que no tener test porque entrena al equipo a ignorar el rojo («ah, es el flaky, re-corrélo»), y el día que el rojo es de verdad, nadie le cree. El `retries: 1` lo puede esconder: un test que pasa recién en el reintento sale en verde, pero el reporte lo marca **flaky**. Por eso el reporte se mira aunque la corrida esté verde. Un flaky suelto puede ser la red; el mismo test flaky dos corridas seguidas es el test, y se arregla.

### La misma imagen del front en QA y en PROD
Lo que **cambia por entorno** va en las variables del servicio de Render, no en la imagen:
- **Front:** `BACKEND_URL` (la api de **su** entorno) y `DNS_RESOLVER`. nginx las lee de la plantilla `default.conf.template` al arrancar (lo resolví en el TP6).
- **Back:** `DATABASE_URL` (la base `app_qa` o `app_prod` de Neon).

Lo que queda **adentro** de la imagen es lo que no depende del entorno: el JavaScript compilado, la config de nginx como plantilla, el código de la api, las migraciones y el **commit** del que salió (`GIT_COMMIT`). El commit es una propiedad **de la imagen**, no del entorno: por eso está bien hornearlo. Si la `BACKEND_URL` estuviera escrita adentro, necesitaría una imagen distinta para cada entorno, y PROD no correría lo que probé en QA.

### Accesibilidad: buscar como una persona
Las e2e buscan los controles por su **nombre accesible** (el que lee un lector de pantalla), no por clases de CSS, que cambian con el diseño. Mi formulario de eventos sólo tenía `placeholder`, que no es un nombre. Agregué:
- `aria-label` en los cuatro campos del formulario,
- cada tarjeta de evento es un `<article>` con el nombre del evento (así el test trabaja adentro de **su** evento),
- el botón «Eliminar evento X» con su nombre,
- `role="alert"` en el banner de error.

### Límite conocido: QA es uno solo
Todas mis corridas despliegan al mismo QA y las dos suites lo usan, una después de la otra. Si mergeo dos PRs seguidos, la corrida B puede redesplegar QA mientras la integración o la e2e de la A están corriendo: la A probaría en parte la imagen de B.
- **Cómo lo reconocería:** un rojo raro en la A, o en *Events* de QA una imagen de B desplegada a una hora en que la A todavía estaba probando.
- **Qué haría:** rechazar la A con el motivo escrito (si quedó esperando aprobación), no re-correr sus pruebas (probarían la imagen de B), y quedarme con la B, que trae los dos cambios.
- **Mi regla:** un merge por vez; antes de mergear miro *Actions*, y si la corrida anterior no terminó `integracion` y `e2e`, espero. Cuando mergeé la rotura, la corrida anterior todavía esperaba la aprobación de PROD, pero sus dos suites **ya habían terminado**: el deploy nuevo a QA no pisó ninguna prueba.
- **Cómo lo resuelve un equipo real:** un entorno por corrida, que nace con ella y se destruye al terminar.

### Qué clase de bug mi gate NO ataja
- Lo que **no recorren** mis flujos: renombrar o desactivar una jugadora, eximir, el dashboard. Si se rompen, la cadena sigue verde.
- Lo que **sólo pasa en PROD**: los datos de verdad (por ejemplo, un nombre muy largo que nadie probó), una variable mal cargada **sólo** en PROD (el smoke de PROD ataja la mayoría), o mucha gente usándola a la vez.
- Lo **visual**: un botón tapado o un color ilegible pasan si el botón existe y se puede clickear.
- Un **cambio a propósito** que el test no conoce: si el botón cambia de nombre porque así lo decidimos, el gate lo frena igual, y hay que cambiar la app y el test en el mismo PR.

### Si mañana cambio Render por otro proveedor
Sobrevive casi todo: las dos imágenes y cómo se publican, las etiquetas `sha-<commit>`, las variables por entorno, el commit horneado en la imagen, las dos suites (no saben de nubes: reciben dos URLs por variable), el orden de la cadena con sus `needs`, el environment `production` con su aprobación, y la release. Cambiaría sólo el paso que le dice al proveedor «ejecutá esta imagen» (el hook con `imgURL`) y las URLs de QA y PROD.

### Herramientas que usé, por fila de la tabla de la guía

| Lo que tenía que lograr | Lo que usé |
|---|---|
| Que el pipeline publique la imagen con el commit | `docker/build-push-action` con `tags: …:sha-${{ github.sha }}` (del TP6, sin cambios) + `build-args: GIT_COMMIT` |
| Que el entorno ejecute esa imagen | Render *Existing Image* + `imgURL` en el deploy hook |
| Pedirle a la api de verdad, sin navegador | Fixture `request` de Playwright (`e2e/api.spec.ts`) |
| Un navegador de verdad | Playwright con Chromium (`e2e/eventos.spec.ts`) |
| Que el test apunte a un entorno u otro | `API_BASE_URL` y `E2E_BASE_URL`, leídas en `api.spec.ts` y `playwright.config.ts` |
| Buscar como una persona | `getByLabel`, `getByRole` (con los `aria-label` que agregué) |
| Reportes, uno por suite | Reporte HTML de Playwright + `upload-artifact` (`playwright-report-integracion` y `playwright-report-e2e`) |

Mis specs son `.ts` y no `.js` como en la guía, porque todo mi front es TypeScript. Los separé de vitest dejándolos en `e2e/`: mi `vitest.config.ts` sólo incluye `src/**/*.test.ts`. Y no viajan en la imagen (están en el `.dockerignore`): corren desde el runner contra QA.

### Release
Cierro el TP con **`v7.0.0`** (tag y Release de GitHub), sobre el commit que *Deployments* dice que está en el environment `production`, no sobre el último de `main`. Aprendí del TP6: esta vez mergeé primero este archivo, aprobé ese deploy a PROD y recién después puse el tag. Así `v7.0.0` nombra exactamente lo que corre en PROD y además trae la documentación completa, sin tener que mover el tag.

### Problemas encontrados y cómo los resolví
- **El smoke iba a dejar de funcionar con *Existing Image*.** Lo vi antes de mergear: `RENDER_GIT_COMMIT` sólo existe cuando Render construye desde el repo. Lo resolví horneando el commit en la imagen (`GIT_COMMIT`), en el mismo PR que cambió los hooks.
- **El orden de los cambios importaba.** Si mergeaba el `imgURL` antes de cambiar la fuente de los cuatro servicios, el hook le mandaba una imagen a un servicio que todavía construía desde el repo. Primero cambié la fuente de uno y lo probé a mano con su hook; después los otros tres, sin desplegar; y recién después mergeé.
- **Después del primer deploy de la imagen, el front de QA daba 502**, y al volver días después daba **429**. En los dos casos era la api de QA dormida (free tier), no la imagen: la desperté abriendo `/api/health` y el front anduvo.
- **El bug del monto** (500 con montos que no entran en la columna): lo encontró la prueba de integración. Arriba está el detalle.
- **«No tests found» al correr las suites en mi máquina.** Seguía parada en `main`: el `git switch feature/e2e` había fallado porque mi git todavía no conocía la rama, y el `git pull` la trajo pero no me cambió. Corrí todo sobre `main`, donde no existe `e2e/`. Lo resolví con `git switch feature/e2e`, `npm ci` y `docker compose up -d --build` de nuevo.
- **Mergeé la rotura sin haber aprobado PROD de la corrida anterior.** Después no encontraba el botón de aprobar, porque miraba la corrida roja (la primera de la lista), que no tenía nada que aprobar. La que esperaba era la anterior. La aprobé ahí: era seguro, porque esa corrida había pasado las dos suites y el `imgURL` lleva **su** commit, no lo último de `main`.
- **Se me cortó la terminal a la noche con el `gh pr checks --watch`**, antes del `gh pr merge`. En GitHub no se perdió nada: los checks terminaron verdes y el PR quedó abierto esperando. Al otro día lo mergeé. La corrida no depende de mi terminal; lo único que me espera es la aprobación.

### Declaración de uso de IA
En este TP usé Claude (asistente de IA) como guía, siguiendo la guía de la cátedra sección por sección. La IA escribió los cambios de código y de configuración: el `imgURL` en los deploys, el commit horneado en la imagen, las dos suites de Playwright, los jobs `integracion` y `e2e`, los `aria-label` del front, el arreglo del monto máximo y la rotura a propósito del botón. También armó los PRs y me ayudó a redactar este archivo a partir de lo que fuimos haciendo.

Lo hice y verifiqué yo: los `docker pull` sin credenciales, el cambio de fuente de los cuatro servicios en Render y el primer deploy a mano con el hook, cargar jugadoras en QA, correr las dos suites contra mi compose (4 y 3 en verde) y abrir la traza, mergear cada PR, mirar cada corrida, aprobar los deploys a PROD, y bajar los dos reportes de la corrida roja para diagnosticar con la captura y la traza. De cada prueba me pedí poder explicar qué verifica, contra qué entorno corre (la integración contra la api de QA, la e2e contra el front de QA) y qué pasa si falla (la e2e no corre si falla la integración, y PROD no pide aprobación si falla cualquiera de las dos).
