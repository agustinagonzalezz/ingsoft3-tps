// Prisma devuelve los montos como Decimal; las reglas de src/rules.ts trabajan
// con `number` para poder testearse con datos planos. Estos helpers hacen esa
// conversión en un solo lugar, en vez de repetirla en cada endpoint.
import { puedeEliminarEvento, type Evento, type Pago, type Gasto, type ParticipanteEvento } from "./rules.js";

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
    participants: e.participants.map(toParticipante),
  };
}

export function toParticipante(p: {
  id: string;
  eventId: string;
  playerId: string;
  exempt: boolean;
  amountOverride: DecimalLike | null;
}): ParticipanteEvento {
  return {
    id: p.id,
    eventId: p.eventId,
    playerId: p.playerId,
    exempt: p.exempt,
    amountOverride: p.amountOverride?.toNumber() ?? null,
  };
}

export function toPago(p: { eventParticipantId: string; amount: DecimalLike; paidAt: Date }): Pago {
  return { eventParticipantId: p.eventParticipantId, amount: p.amount.toNumber(), paidAt: p.paidAt };
}

export function toGasto(g: { amount: DecimalLike; date: Date }): Gasto {
  return { amount: g.amount.toNumber(), date: g.date };
}

// Lo que GET /api/eventos le manda a la UI por cada evento (antes se armaba
// adentro del handler). Acá viven dos reglas que la pantalla usa:
// - montoEsperado: el override de la jugadora o, si no tiene, el monto del evento.
//   Con `??` y no `||`: un override de 0 es válido y no tiene que volverse el monto.
// - pagada: la participación tiene al menos un pago registrado.
type PagoConMonto = { eventParticipantId: string; amount: DecimalLike; paidAt: Date };

export type EventoConDetalle = {
  id: string;
  name: string;
  type: string;
  amount: DecimalLike;
  dueDate: Date;
  createdAt: Date;
  participants: {
    id: string;
    eventId: string;
    playerId: string;
    exempt: boolean;
    amountOverride: DecimalLike | null;
    player: { name: string };
    payments: PagoConMonto[];
  }[];
};

export function toEventoVM(evento: EventoConDetalle) {
  const amount = evento.amount.toNumber();
  const pagos = evento.participants.flatMap((p) => p.payments.map(toPago));
  return {
    id: evento.id,
    name: evento.name,
    type: evento.type,
    amount,
    dueDate: evento.dueDate,
    puedeEliminar: puedeEliminarEvento(toEvento(evento), pagos),
    participantes: evento.participants.map((p) => ({
      eventParticipantId: p.id,
      playerId: p.playerId,
      playerName: p.player.name,
      montoEsperado: p.amountOverride?.toNumber() ?? amount,
      exempt: p.exempt,
      pagada: p.payments.length > 0,
    })),
  };
}
