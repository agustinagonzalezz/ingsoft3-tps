// Prisma devuelve los montos como Decimal; las reglas de src/rules.ts trabajan
// con `number` para poder testearse con datos planos. Estos helpers hacen esa
// conversión en un solo lugar, en vez de repetirla en cada endpoint.
import type { Evento, Pago, Gasto } from "./rules.js";

type DecimalLike = { toNumber(): number };

export function toEvento(e: {
  id: string;
  amount: DecimalLike;
  dueDate: Date;
  createdAt: Date;
  participants: {
    id: string;
    eventId: string;
    playerId: string;
    exempt: boolean;
    amountOverride: DecimalLike | null;
  }[];
}): Evento {
  return {
    id: e.id,
    amount: e.amount.toNumber(),
    dueDate: e.dueDate,
    createdAt: e.createdAt,
    participants: e.participants.map((p) => ({
      id: p.id,
      eventId: p.eventId,
      playerId: p.playerId,
      exempt: p.exempt,
      amountOverride: p.amountOverride?.toNumber() ?? null,
    })),
  };
}

export function toPago(p: { eventParticipantId: string; amount: DecimalLike; paidAt: Date }): Pago {
  return { eventParticipantId: p.eventParticipantId, amount: p.amount.toNumber(), paidAt: p.paidAt };
}

export function toGasto(g: { amount: DecimalLike; date: Date }): Gasto {
  return { amount: g.amount.toNumber(), date: g.date };
}
