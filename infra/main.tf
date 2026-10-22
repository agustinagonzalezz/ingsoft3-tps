terraform {
  required_version = ">= 1.5"

  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.18.0" # fijada: el repo del provider está archivado (ver decisiones.md)
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
  }
}

# Las credenciales NO están acá: cada provider las lee del entorno.
#   neon:   NEON_API_KEY
#   render: RENDER_API_KEY y RENDER_OWNER_ID
provider "neon" {}
provider "render" {}

# --- La base de PREPROD: no existe hasta que esto se aplica ---

# Proyecto propio de Neon para preprod: se puede destruir entero sin tocar
# el proyecto (creado a mano en el TP6) donde viven app_qa y app_prod.
resource "neon_project" "preprod" {
  name   = "teampay-preprod"
  org_id = var.neon_org_id # Neon ahora agrupa los proyectos en organizaciones y la API exige decir en cuál

  # La región se DECLARA: sin esta línea Neon eligió Oregon la primera vez y Ohio
  # al recrear. Oregon = la misma región que los servicios de Render.
  region_id = var.neon_region

  # Sin esto el primer apply falla: el provider pide 1 día de historial
  # (86400 s) y el tope del plan gratuito es 6 horas (21600 s).
  history_retention_seconds = 21600
}

resource "neon_role" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id # default_branch_id, no branch_id
  name       = "app_preprod_owner"
}

resource "neon_database" "preprod" {
  project_id = neon_project.preprod.id
  branch_id  = neon_project.preprod.default_branch_id
  name       = "app_preprod"
  owner_name = neon_role.preprod.name
}

# --- Los dos servicios de PREPROD en Render (con la imagen del TP7) ---

locals {
  # La cadena de conexión se ARMA con lo que devolvió Neon: nadie la copia y pega
  # (en el TP6 la pegaba a mano en Render). urlencode por si la contraseña trae
  # caracteres que rompen una URL. Es el formato que lee Prisma (backend/src/db.ts).
  database_url = "postgresql://${neon_role.preprod.name}:${urlencode(neon_role.preprod.password)}@${neon_project.preprod.database_host}/${neon_database.preprod.name}?sslmode=require"
}

resource "render_web_service" "api" {
  name              = "teampay-api-preprod"
  plan              = "free"
  region            = var.region
  health_check_path = "/api/health"

  runtime_source = {
    image = {
      image_url = var.image_repo_api # SIN la etiqueta
      tag       = var.image_tag      # la etiqueta va acá
    }
  }

  # NO va GIT_COMMIT: viene horneado en la imagen y una variable del servicio lo pisaría.
  # Las tablas las crea el docker-entrypoint.sh (prisma migrate deploy) al arrancar.
  env_vars = {
    DATABASE_URL = { value = local.database_url }
  }
}

resource "render_web_service" "front" {
  name   = "teampay-front-preprod"
  plan   = "free"
  region = var.region

  runtime_source = {
    image = {
      image_url = var.image_repo_front
      tag       = var.image_tag
    }
  }

  env_vars = {
    # La dirección del backend sale del atributo url de SU api, no de un copy-paste.
    # trimsuffix: con una barra al final nginx mandaría todo a "/" (TP6).
    BACKEND_URL  = { value = trimsuffix(render_web_service.api.url, "/") }
    DNS_RESOLVER = { value = "8.8.8.8" }
  }
}
