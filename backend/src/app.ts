// La app Express se arma acá y se exporta SIN llamar a listen(): así los
// tests del TP5 pueden levantarla en memoria (supertest) sin abrir puertos.
import express, { type ErrorRequestHandler } from "express";
import { jugadorasRouter } from "./routes/jugadoras.js";
import { eventosRouter } from "./routes/eventos.js";
import { participacionesRouter } from "./routes/participaciones.js";
import { dashboardRouter } from "./routes/dashboard.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  // Healthcheck para compose (y más adelante para el deploy del TP6).
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/jugadoras", jugadorasRouter);
  app.use("/api/eventos", eventosRouter);
  app.use("/api/participaciones", participacionesRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

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
