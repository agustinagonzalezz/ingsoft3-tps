## TP1 - Git colaborativo

### Por que Git no pudo resolver el conflicto solo

Dos ramas (\eature/titulo-a\ y otra rama en paralelo) modificaron la **misma linea** del mismo archivo (\README.md\, la linea del titulo del proyecto) de forma simultanea, cada una con un texto distinto. Git resuelve automaticamente los cambios que tocan lineas o archivos distintos, pero cuando dos ramas editan la misma linea no tiene forma de decidir cual de las dos versiones es la "correcta" ? ambas son ediciones vlaidas del mismo lugar del archivo, y elegir entre ellas es una decision de contenido, no algo que se pueda resolver con un algoritmo de diff. Para que nunca hubiera aparecido el conflicto, alguna de las dos ramas tendria que haber hecho \pull\/rebase de \main\ antes de tocar esa linea, viendo el cambio de la otra rama antes de proponer el propio.

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
## TP3 - Planificaci?n y trazabilidad

### Duraci?n del sprint

Eleg? un sprint de **2 semanas**. Con la cursada organizada en entregas peri?dicas de TPs, un ciclo de 2 semanas da margen suficiente para completar una historia con sus tareas sin que el sprint quede vac?o de contenido (como pasar?a con 1 semana, muy ajustado para el ritmo de la materia), y sin extenderse tanto como para perder el sentido de "iteraci?n corta" que tiene un sprint (como pasar?a con 4 semanas).

### L?mite de trabajo en progreso (WIP)

Configur? el l?mite en **2** para la columna "In Progress". La regla de arranque es cantidad de personas + 1; trabajando solo, eso da 1 + 1 = 2. El "+1" es la v?lvula de escape para cuando algo queda trabado esperando una revisi?n o una respuesta externa y necesito poder avanzar en otra cosa sin quedarme frenado. Si en la pr?ctica nunca llego a alcanzar el l?mite, es se?al de que est? demasiado alto y convendr?a bajarlo a 1.

### Diagn?stico de la historia mal escrita

La historia "Como desarrollador quiero crear la tabla usuarios para guardar los datos" est? mal escrita porque es una **tarea disfrazada de historia**: describe una acci?n t?cnica interna (crear una tabla), no un incremento de valor observable por un usuario o rol de negocio. Nadie "quiere" una tabla; el "para" no justifica una prioridad de producto, solo describe un paso de implementaci?n. La reescribir?a subiendo un nivel de abstracci?n, por ejemplo: "Como usuario quiero poder registrarme en la aplicaci?n para acceder con mis propias credenciales" ? y "crear la tabla usuarios" pasar?a a ser una de las tareas t?cnicas dentro de esa historia.

### Problemas encontrados y c?mo los resolv?

- Al armar la jerarqu?a, intent? pararme en el repo usando un placeholder de ruta sin reemplazarlo (\<tu-repo-de-la-app>\), lo que gener? un error de ruta inv?lida en PowerShell. Lo resolv? listando el contenido de la carpeta con \dir\ hasta encontrar la carpeta real del proyecto, y confirmando que era el repo correcto con \git status\ y \git remote -v\.
- Descubr? en el proceso que mi repo local hab?a quedado en una carpeta anidada con el mismo nombre (\ingsoft3-tps\\ingsoft3-tps\) y que el remoto hab?a sido renombrado respecto al que us? en TP1/TP2 (\ingsoft3-tp01\ ? \ingsoft3-tps\). Verifiqu? con \git remote -v\ y \dir\ que el contenido de la app (Dockerfile, decisiones.md, evidencias.md previos) segu?a intacto antes de continuar, para no perder trabajo previo.
- Al crear el PR de CI, tuve que confirmar expl?citamente que el \Closes #N\ apuntara al n?mero de la **tarea** (#10) y no al de la historia (#9), para no cerrar la historia con trabajo pendiente sin terminar.

### Declaraci?n de uso de IA

Us? Claude (Anthropic) como asistente durante todo el TP3: gu?a paso a paso para crear las etiquetas, la ?pica, la historia, las tareas y el bug v?a \gh issue create\; armado de la jerarqu?a con \gh issue edit --add-sub-issue\; configuraci?n del Project (visibilidad p?blica, vista Board, campo Sprint, l?mite de WIP); y redacci?n del workflow \.github/workflows/ci.yml\ y el PR de trazabilidad. Verifiqu? cada paso ejecutando los comandos yo mismo y revisando la salida real en mi terminal y en GitHub (n?meros de issue, estado de los checks del PR, campo "Parent" y "Projects" del issue cerrado) antes de continuar al siguiente paso.

## TP4 - CI: Pipelines as Code

### Estructura elegida del pipeline

Mi app tiene un ?nico Dockerfile (Next.js con App Router unifica front y back en un solo proceso, decisi?n ya justificada en el TP2), as? que el pipeline tiene **un solo job** (\uild\) en vez de los dos jobs en paralelo (backend/frontend) que propone la gu?a para stacks separados. No invent? un segundo job vac?o para llegar a un n?mero: el pipeline construye exactamente lo que la app tiene. El trigger es \pull_request\ (verifica antes del merge, alimenta el gate) y \push\ a \main\ (deja la corrida que lee el badge y que adem?s guarda el cache que despu?s reutiliza cualquier PR nuevo).

### Qu? cachea el pipeline

Se cachean las capas de la imagen Docker v?a \docker/setup-buildx-action\ + \cache-from\/\cache-to: type=gha\. En la segunda corrida del mismo PR, **todas** las capas mostraron \CACHED\: la instalaci?n de dependencias (\
pm ci\), la generaci?n de Prisma (\
px prisma generate\), el build de Next (\
pm run build\) y todas las copias entre etapas del Dockerfile multi-stage. Esto tiene sentido porque entre una corrida y la otra no cambi? ning?n archivo relevante (us? un commit vac?o para dispararla). Si el cache desaparece, el pipeline sigue funcionando igual, solo que reconstruye todo desde cero ? no es una dependencia real, es una optimizaci?n de velocidad.

### Por qu? el pipeline construye con mi Dockerfile en vez de compilar por su cuenta

Si el workflow corriera \
pm run build\ directamente en vez de delegarle todo a \docker build\, tendr?a dos definiciones distintas de c?mo se arma la app: la que usa el pipeline para verificar, y la que uso despu?s para desplegar (v?a el mismo Dockerfile). Con el tiempo esas dos definiciones divergen y terminar?a verificando algo distinto de lo que realmente se despliega. Usando el Dockerfile como ?nica fuente de verdad, lo que el pipeline verifica es exactamente lo que se va a correr en producci?n.

### Problemas encontrados y c?mo los resolv?

- Al configurar el gate por la web (Settings ? Branches ? Require status checks), el checkbox se guard? pero el campo \contexts\ qued? vac?o ? lo detect? corriendo \gh api .../branches/main/protection --jq '.required_status_checks'\ antes de seguir. Lo resolv? aplicando la protecci?n completa v?a \gh api --method PUT\, re-declarando tambi?n lo que ya ten?a del TP1 (0 approvals + \enforce_admins: true\) para no perderlo, ya que el PUT reescribe la protecci?n entera en vez de mezclarla.
- Al agregar el badge del README en un PR nuevo, el merge con \main\ gener? un conflicto porque un PR anterior (el de relleno de la demo del gate) hab?a agregado una l?nea en blanco al final del mismo archivo. Lo resolv? actualizando primero mi \main\ local (estaba desactualizado respecto del remoto, por eso \git merge main\ no tra?a nada al principio), y despu?s resolviendo el conflicto a mano en VS Code conservando ambos cambios: el badge arriba y el resto del contenido tal como estaba.
- Verifiqu? que el error de "Cannot merge binary files" que mostr? Git no era un problema real de codificaci?n (los bytes del archivo eran ASCII/UTF-8 normal) sino un falso positivo del propio Git al intentar el auto-merge; se resolvi? igual editando el archivo directamente.

### Declaraci?n de uso de IA

Us? Claude (Anthropic) como asistente durante todo el TP4: adaptaci?n del workflow de dos jobs a uno solo (justificada por mi Dockerfile ?nico), redacci?n del YAML con cache de capas, configuraci?n del gate v?a \gh api\, diagn?stico del conflicto de merge en el README y de la protecci?n de rama mal guardada, y armado de la secuencia de la demo (romper el build ? PR bloqueado ? fix ? verde ? merge). Verifiqu? cada paso ejecutando los comandos yo mismo: revis? el log de cada corrida en la pesta?a Actions (\CACHED\ en las capas, el error real de TypeScript al romper el build), el estado real de la protecci?n de rama con \gh api\, y el resultado final del README y el badge en GitHub antes de dar cada paso por cerrado.

