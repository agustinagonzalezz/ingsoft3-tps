# Evidencias — TP1

## 1. Push directo a main rechazado
GitHub rechaza el push porque main está protegida y la regla alcanza también al dueño del repo.

<img width="389" height="165" alt="image" src="https://github.com/user-attachments/assets/dd26876e-4b14-4ec1-9a29-6f11c27113cc" />


## 2. El PR de la rama B no se puede mergear.
Hay un conflicto ya que se modifico el mismo archivo en la misma rama por dos personas distintas.

<img width="254" height="245" alt="image" src="https://github.com/user-attachments/assets/953e56ea-ef95-4cb1-90ee-f0bf0ad97ef4" />

## 3. En el PR de la rama B
Muestro los conflictos entre ambas ramas (Ay B)

<img width="264" height="181" alt="image" src="https://github.com/user-attachments/assets/757ea03a-3804-414f-9a9a-723ac0023281" />

## 4. Relase publicado

<img width="281" height="247" alt="image" src="https://github.com/user-attachments/assets/1a3aa2ff-7001-4faf-bb9a-e70bc2da560d" />




## TP2 — Contenedores

Capturas de la app dockerizada funcionando de punta a punta.

### 1. Build de las imágenes

Captura de `docker compose up -d --build` corriendo sin errores.

![build completo](evidencias/01-build.png)

### 2. Contenedores corriendo

Salida de `docker compose ps`: `postgres` healthy y `app` running.

![docker compose ps](evidencias/02-compose-ps.png)

### 3. Migraciones aplicadas al arrancar

Salida de `docker compose logs app`, mostrando la migración aplicándose
antes de que arranque el servidor de Next.

![logs de migración](evidencias/03-logs-migracion.png)

### 4. App funcionando

La app corriendo en `http://localhost:3000/jugadoras`, servida desde el
contenedor.

![app funcionando](evidencias/04-dashboard.png)

### 5. Persistencia de datos

**5a.** Se carga un dato de prueba desde la app.

![dato de prueba cargado](evidencias/05a-dato-prueba.png)

**5b.** Después de `docker compose down` (sin `-v`) y `docker compose up -d`
de nuevo: el dato sigue ahí. El volumen `postgres_data` persiste los datos
aunque el contenedor se destruya y recree.

![dato persiste tras down/up](evidencias/05b-persiste.png)

**5c.** Después de `docker compose down -v` (con `-v`) y `docker compose up -d`:
la tabla vuelve a estar vacía y las migraciones se re-aplican solas sobre el
volumen limpio.

![datos borrados tras down -v](evidencias/05c-down-v.png)

### 6. Imágenes publicadas (ghcr.io)

Imagen publicada como pública en GitHub Container Registry, tag `v0.1.0`:
`ghcr.io/agustinagonzalezz/ingsoft3-tp01:v0.1.0`

![imagen publicada](evidencias/06-imagen-publicada.png)

### 7. Arranque desde las imágenes publicadas

`docker compose -f docker-compose.registry.yml up -d` levantando el sistema
completo descargando la imagen del registry, sin buildear local.

![arranque desde registry](evidencias/07-registry-up.png)

