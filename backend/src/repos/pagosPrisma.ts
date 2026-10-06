// Implementación REAL de PagosRepo: habla con Postgres a través de Prisma.
// Acá vive la conversión Decimal -> number, para que el servicio trabaje con datos planos.
import { db } from "../db.js";
import type { PagoRegistrado, PagosRepo } from "../services/pagos.js";

const aPago = (p: { id: string; eventParticipantId: string; amount: { toNumber(): number }; paidAt: Date }): PagoRegistrado => ({
  id: p.id,
  eventParticipantId: p.eventParticipantId,
  amount: p.amount.toNumber(),
  paidAt: p.paidAt,
});

export const pagosPrisma: PagosRepo = {
  async buscarParticipacion(id) {
    const p = await db.eventParticipant.findUnique({
      where: { id },
      include: { event: true, payments: true },
    });
    if (!p) return null;
    return {
      id: p.id,
      exempt: p.exempt,
      amountOverride: p.amountOverride?.toNumber() ?? null,
      montoEvento: p.event.amount.toNumber(),
      pagos: p.payments.map(aPago),
    };
  },

  async crearPago(participacionId, monto) {
    const pago = await db.payment.create({ data: { eventParticipantId: participacionId, amount: monto } });
    return aPago(pago);
  },
};