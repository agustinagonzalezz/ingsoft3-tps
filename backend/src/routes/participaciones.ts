import { Router } from "express";
import { db } from "../db.js";

export const participacionesRouter = Router();

// PUT /api/participaciones/:id/pago — marca como pagada.
// El monto lo calcula el backend (override o monto del evento): antes lo
// mandaba el cliente, y eso permitía registrar cualquier importe.
participacionesRouter.put("/:id/pago", async (req, res) => {
  const participante = await db.eventParticipant.findUnique({
    where: { id: req.params.id },
    include: { event: true, payments: true },
  });
  if (!participante) {
    res.status(404).json({ error: "Participación no encontrada" });
    return;
  }
  if (participante.exempt) {
    res.status(409).json({ error: "La jugadora está exenta de este evento" });
    return;
  }
  if (participante.payments.length > 0) {
    res.status(200).json(participante.payments[0]); // idempotente
    return;
  }
  const monto = participante.amountOverride ?? participante.event.amount;
  const pago = await db.payment.create({ data: { eventParticipantId: participante.id, amount: monto } });
  res.status(201).json({ ...pago, amount: pago.amount.toNumber() });
});

// DELETE /api/participaciones/:id/pago — desmarca (borra los pagos).
participacionesRouter.delete("/:id/pago", async (req, res) => {
  await db.payment.deleteMany({ where: { eventParticipantId: req.params.id } });
  res.status(204).end();
});
