import { describe, it, expect } from "vitest";
import {
  calcularBalanceEquipo,
  calcularDeudaJugadora,
  eximirJugadora,
  jugadoraInactivaSinDeudaFutura,
  puedeEliminarEvento,
  validarMontoEvento,
  type Evento,
  type Jugadora,
  type Pago,
  type ParticipanteEvento,
} from "./rules.js";

// ---- Fábricas de datos: cada test cambia solo lo que le importa ----
const jugadora = (over: Partial<Jugadora> = {}): Jugadora => ({
  id: "j1",
  active: true,
  createdAt: new Date("2026-01-01"),
  deactivatedAt: null,
  ...over,
});

const participante = (over: Partial<ParticipanteEvento> = {}): ParticipanteEvento => ({
  id: "p1",
  eventId: "e1",
  playerId: "j1",
  exempt: false,
  amountOverride: null,
  ...over,
});

const evento = (over: Partial<Evento> = {}): Evento => ({
  id: "e1",
  amount: 1000,
  dueDate: new Date("2026-03-01"),
  createdAt: new Date("2026-02-01"),
  participants: [participante()],
  ...over,
});

const pago = (over: Partial<Pago> = {}): Pago => ({
  eventParticipantId: "p1",
  amount: 1000,
  paidAt: new Date("2026-02-15"),
  ...over,
});

// ---- Regla 1: deuda de una jugadora ----
describe("calcularDeudaJugadora", () => {
  it("descuenta un pago parcial del monto del evento", () => {
    const pagos = [pago({ amount: 400 })];

    const deuda = calcularDeudaJugadora(jugadora(), [evento()], pagos);

    expect(deuda).toBe(600);
  });

  it("usa el monto personalizado de la jugadora en lugar del monto del evento", () => {
    const e = evento({ participants: [participante({ amountOverride: 500 })] });

    expect(calcularDeudaJugadora(jugadora(), [e], [])).toBe(500);
  });

  it("no le cobra un evento del que está exenta", () => {
    const e = evento({ participants: [participante({ exempt: true })] });

    expect(calcularDeudaJugadora(jugadora(), [e], [])).toBe(0);
  });

  it("un pago de más en un evento no compensa la deuda de otro", () => {
    const e1 = evento();
    const e2 = evento({ id: "e2", participants: [participante({ id: "p2", eventId: "e2" })] });
    const pagos = [pago({ eventParticipantId: "p1", amount: 1500 })]; // pagó 500 de más en e1

    expect(calcularDeudaJugadora(jugadora(), [e1, e2], pagos)).toBe(1000); // e2 sigue debiéndose entero
  });
});

// ---- Regla 2: balance del equipo ----
describe("calcularBalanceEquipo", () => {
  it("incluye los movimientos que caen justo en los extremos del rango", () => {
    const desde = new Date("2026-02-01");
    const hasta = new Date("2026-02-28");
    const pagos = [
      pago({ amount: 1000, paidAt: desde }), // borde inferior: entra
      pago({ amount: 1000, paidAt: hasta }), // borde superior: entra
      pago({ amount: 9999, paidAt: new Date("2026-03-01") }), // afuera
    ];
    const gastos = [{ amount: 300, date: hasta }];

    const r = calcularBalanceEquipo([], pagos, gastos, desde, hasta);

    expect(r).toEqual({ recaudado: 2000, gastos: 300, balance: 1700 });
  });
});

// ---- Regla 3: no se elimina un evento con pagos ----
describe("puedeEliminarEvento", () => {
  it("no permite eliminar un evento que tiene al menos un pago", () => {
    expect(puedeEliminarEvento(evento(), [pago()])).toBe(false);
  });

  it("permite eliminarlo si los pagos son de otro evento", () => {
    expect(puedeEliminarEvento(evento(), [pago({ eventParticipantId: "otro" })])).toBe(true);
  });
});

// ---- Regla 4: monto de evento > 0 (parametrizado + caso de error) ----
describe("validarMontoEvento", () => {
  it.each([
    ["cero", 0],
    ["negativo", -100],
    ["no numérico (NaN)", Number.NaN],
  ])("rechaza un monto %s", (_caso, monto) => {
    expect(validarMontoEvento(monto)).toBe(false);
  });

  it("acepta el monto positivo más chico (borde)", () => {
    expect(validarMontoEvento(0.01)).toBe(true);
  });
});

// ---- Regla 5: eximir a una jugadora ----
describe("eximirJugadora", () => {
  it("marca como exenta solo a esa jugadora y no toca a las demás", () => {
    const lista = [participante(), participante({ id: "p2", playerId: "j2" })];

    const r = eximirJugadora(lista, "e1", "j1");

    expect(r.find((p) => p.playerId === "j1")?.exempt).toBe(true);
    expect(r.find((p) => p.playerId === "j2")?.exempt).toBe(false);
  });

  it("crea la participación exenta si la jugadora no estaba en el evento", () => {
    const r = eximirJugadora([], "e1", "j9");

    expect(r).toEqual([
      { id: "e1:j9", eventId: "e1", playerId: "j9", exempt: true, amountOverride: null },
    ]);
  });
});

// ---- Regla 6: inactiva no suma deuda de eventos posteriores ----
describe("jugadoraInactivaSinDeudaFutura", () => {
  it("descarta los eventos creados después de la desactivación", () => {
    const inactiva = jugadora({ active: false, deactivatedAt: new Date("2026-02-10") });
    const viejo = evento({ id: "viejo", createdAt: new Date("2026-02-01") });
    const nuevo = evento({ id: "nuevo", createdAt: new Date("2026-02-20") });

    const r = jugadoraInactivaSinDeudaFutura(inactiva, [viejo, nuevo]);

    expect(r.map((e) => e.id)).toEqual(["viejo"]);
  });

  it("a una jugadora activa no le filtra ningún evento", () => {
    const eventos = [evento({ id: "a" }), evento({ id: "b" })];

    expect(jugadoraInactivaSinDeudaFutura(jugadora(), eventos)).toEqual(eventos);
  });
});