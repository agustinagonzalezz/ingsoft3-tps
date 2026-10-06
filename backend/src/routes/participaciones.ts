import { Router } from "express";
import { db } from "../db.js";
import { marcarPago } from "../services/pagos.js";
import { pagosPrisma } from "../repos/pagosPrisma.js";

export const participacionesRouter = Router();

// PUT /api/participaciones/:id/pago — marca como pagada.
// El handler solo traduce HTTP <-> servicio: pide, delega, responde.
// La lógica (exenta, idempotencia, monto) vive en services/pagos.ts.
participacionesRouter.put("/:id/pago", async (req, res) => {
  const resultado = await marcarPago(pagosPrisma, req.params.id);

  switch (resultado.tipo) {
    case "no-encontrada":
      res.status(404).json({ error: "Participación no encontrada" });
      return;
    case "exenta":
      res.status(409).json({ error: "La jugadora está exenta de este evento" });
      return;
    case "ya-pagada":
      res.status(200).json(resultado.pago); // idempotente
      return;
    case "registrado":
      res.status(201).json(resultado.pago);
      return;
  }
});

// DELETE /api/participaciones/:id/pago — desmarca (borra los pagos).
participacionesRouter.delete("/:id/pago", async (req, res) => {
  await db.payment.deleteMany({ where: { eventParticipantId: req.params.id } });
  res.status(204).end();
});