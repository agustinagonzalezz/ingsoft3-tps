import { describe, expect, it } from "vitest";
import { toEvento, toEventoVM, toGasto, toPago, type EventoConDetalle } from "./mappers.js";

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

describe("toEventoVM", () => {
  // Fábrica: un evento de $3000 con una participante; cada test cambia solo lo que le importa.
  const participanteVM = (over: Partial<EventoConDetalle["participants"][number]> = {}) => ({
    id: "p1",
    eventId: "e1",
    playerId: "j1",
    exempt: false,
    amountOverride: null,
    player: { name: "Ana" },
    payments: [],
    ...over,
  });
  const eventoVM = (participants: EventoConDetalle["participants"]): EventoConDetalle => ({
    id: "e1",
    name: "Cuota octubre",
    type: "CUOTA",
    amount: dec(3000),
    dueDate: VENCE,
    createdAt: CREADO,
    participants,
  });
  const pago = { eventParticipantId: "p1", amount: dec(3000), paidAt: VENCE };

  it.each([
    ["sin override, el monto del evento", null, 3000],
    ["con override, el override", dec(1500), 1500],
    ["con override 0, 0 (no el monto del evento)", dec(0), 0], // `||` acá devolvería 3000
  ])("montoEsperado: %s", (_caso, amountOverride, esperado) => {
    const vm = toEventoVM(eventoVM([participanteVM({ amountOverride })]));

    expect(vm.participantes[0].montoEsperado).toBe(esperado);
  });

  it("una participante sin pagos no está pagada y el evento se puede eliminar", () => {
    const vm = toEventoVM(eventoVM([participanteVM()]));

    expect(vm.participantes[0].pagada).toBe(false);
    expect(vm.puedeEliminar).toBe(true);
  });

  it("con un pago, la participante está pagada y el evento ya no se puede eliminar", () => {
    const vm = toEventoVM(eventoVM([participanteVM({ payments: [pago] })]));

    expect(vm.participantes[0].pagada).toBe(true);
    expect(vm.puedeEliminar).toBe(false);
  });

  it("arma los datos de la participante para la UI", () => {
    const vm = toEventoVM(eventoVM([participanteVM({ exempt: true })]));

    expect(vm.amount).toBe(3000);
    expect(vm.participantes[0]).toMatchObject({
      eventParticipantId: "p1",
      playerId: "j1",
      playerName: "Ana",
      exempt: true,
    });
  });
});
