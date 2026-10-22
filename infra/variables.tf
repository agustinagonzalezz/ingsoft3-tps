# Valores configurables de preprod. Ninguno es secreto: por eso van con
# default en un archivo que SÍ se commitea (los secretos los leen los providers del entorno).

variable "neon_org_id" {
  description = "Organización de Neon donde se crea el proyecto de preprod (la API de Neon lo exige)"
  type        = string
  default     = "org-weathered-grass-81671481"
}

# Región de la base: la misma que Render (oregon = aws-us-west-2). Si no se declara,
# Neon elige una por defecto y no siempre la misma.
variable "neon_region" {
  type    = string
  default = "aws-us-west-2"
}

# La imagen del TP7: el repo SIN la etiqueta, y la etiqueta en su propio campo.
variable "image_repo_api" {
  type    = string
  default = "ghcr.io/agustinagonzalezz/ingsoft3-tps-backend"
}

variable "image_repo_front" {
  type    = string
  default = "ghcr.io/agustinagonzalezz/ingsoft3-tps-frontend"
}

# El merge del TP7 que llegó a PROD con la cadena completa (PR #41).
# Fija a propósito: para que preprod corra otra imagen se cambia esta línea por PR
# y se RECREA el servicio (Render no deja actualizar un servicio free).
variable "image_tag" {
  type    = string
  default = "sha-9b5c9cf4b5a03a66ec201ac2aa6851e75bb92077"
}

# La misma región que QA y PROD en Render, y que la base de Neon (us-west-2).
variable "region" {
  type    = string
  default = "oregon"
}
