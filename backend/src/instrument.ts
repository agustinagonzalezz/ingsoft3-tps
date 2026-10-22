// TP9 §3.5: Sentry, para ver qué falla, qué tarda y qué se usa en producción.
// Este archivo se carga ANTES que la app (node --import ./dist/instrument.js, ver Dockerfile):
// Sentry tiene que engancharse a Express y al driver de Postgres antes de que se importen,
// si no, no puede medir cuánto tarda cada pedido ni cada consulta a la base.
import "dotenv/config";
import * as Sentry from "@sentry/node";

Sentry.init({
  // El DSN llega por el entorno: sólo está cargado en el servicio de PROD de Render.
  // Si no está (mi máquina, los tests, QA), Sentry queda apagado y la api anda igual.
  dsn: process.env.SENTRY_DSN,
  // De qué servicio vino el dato. Render pone RENDER_SERVICE_NAME solo (p. ej. teampay-api-prod).
  environment: process.env.RENDER_SERVICE_NAME ?? "local",
  // De qué commit salió la imagen (el mismo que devuelve /api/health, TP7).
  release: process.env.GIT_COMMIT,
  // Medir el 100 % de los pedidos: la app tiene poco tráfico y el plan gratis sobra.
  tracesSampleRate: 1.0,
  // El P2025 de Prisma (registro no encontrado) es un 404 esperado, no una falla: no lo mando.
  beforeSend(event, hint) {
    const err = hint.originalException as { code?: string } | undefined;
    return err?.code === "P2025" ? null : event;
  },
});
