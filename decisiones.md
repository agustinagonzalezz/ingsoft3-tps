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
