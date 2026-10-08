import { describe, expect, it } from "vitest";
import { toEvento, toGasto, toPago } from "./mappers.js";

// Prisma entrega los montos como Decimal. Los mappers solo usan toNumber(),
// así que alcanza con un doble mínimo (un stub) en vez de importar Prisma.
const dec = (n: number) => ({ toNumber: () => n });

const VENCE = new Date("2026-10-15T00:00:00.000Z");
const CREADO = new Date("2026-10-01T00:00:00.000Z");

describe("toPago", () => {
  it("convierte el monto Decimal a number y conserva el resto", () => {
    const pago = toPago({ eventParticipantId: "p1", amount: dec(1500.5), paidAt: VENCE });

    expect(pago).toEqual({ eventParticipantId: "p1", amount: 1500.5, paidAt: VENCE });
  });
});

describe("toGasto", () => {
  it("convierte el monto Decimal a number", () => {
    expect(toGasto({ amount: dec(800), date: VENCE })).toEqual({ amount: 800, date: VENCE });
  });
});

describe("toEvento", () => {
  it("convierte el monto del evento y el override de la participante", () => {
    const evento = toEvento({
      id: "e1",
      amount: dec(3000),
      dueDate: VENCE,
      createdAt: CREADO,
      participants: [{ id: "p1", eventId: "e1", playerId: "j1", exempt: false, amountOverride: dec(1500) }],
    });

    expect(evento.amount).toBe(3000);
    expect(evento.participants[0].amountOverride).toBe(1500);
  });
    it("sin override deja null (la jugadora paga el monto del evento)", () => {
    const evento = toEvento({
      id: "e1",
      amount: dec(3000),
      dueDate: VENCE,
      createdAt: CREADO,
      participants: [{ id: "p2", eventId: "e1", playerId: "j2", exempt: false, amountOverride: null }],
    });

    expect(evento.participants[0].amountOverride).toBeNull();
  });
});
