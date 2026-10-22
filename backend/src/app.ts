// La app Express se arma acá y se exporta SIN llamar a listen(): así los
// tests del TP5 pueden levantarla en memoria (supertest) sin abrir puertos.
import express, { type ErrorRequestHandler } from "express";
import * as Sentry from "@sentry/node";
import { jugadorasRouter } from "./routes/jugadoras.js";
import { eventosRouter } from "./routes/eventos.js";
import { participacionesRouter } from "./routes/participaciones.js";
import { dashboardRouter } from "./routes/dashboard.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  // Healthcheck para compose y para el smoke test del deploy (TP6).
  // `commit`: de qué commit salió la IMAGEN que está corriendo (TP7). El pipeline lo hornea
  // al construirla (build-arg GIT_COMMIT -> ENV en el Dockerfile), así que viaja adentro de la
  // imagen a QA y a PROD. El smoke lo compara con el commit de la corrida: si el deploy falló,
  // Render sigue sirviendo la imagen vieja, y sin esto el smoke daría verde contra ésa.
  // (En el TP6 salía de RENDER_GIT_COMMIT, que Render sólo pone cuando construye desde el repo.)
  // Una imagen construida a mano, sin el build-arg, devuelve "local".
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", commit: process.env.GIT_COMMIT || "local" });
  });

  app.use("/api/jugadoras", jugadorasRouter);
  app.use("/api/eventos", eventosRouter);
  app.use("/api/participaciones", participacionesRouter);
  app.use("/api/dashboard", dashboardRouter);

  // ⚠️ TEMPORAL (TP9 §3.5): un endpoint que falla a propósito, para ver un error llegar a Sentry.
  // Se saca cuando termina el práctico.
  app.get("/api/falla", () => {
    throw new Error("Falla de prueba del TP9");
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  // TP9: Sentry recibe los errores ANTES que mi handler (que es el que contesta el 500).
  // (El P2025, un 404 esperado, se descarta en instrument.ts.)
  Sentry.setupExpressErrorHandler(app);

  // Express 5 propaga solo los errores de handlers async: caen acá.
  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    // Prisma P2025 = registro no encontrado (update/delete sobre un id inexistente).
    if (err?.code === "P2025") {
      res.status(404).json({ error: "Registro no encontrado" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  };
  app.use(onError);

  return app;
}
