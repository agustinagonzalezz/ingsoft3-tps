import { describe, it, expect } from "vitest";
import {
  armarCambiosJugadora,
  calcularBalanceEquipo,
  calcularPendienteEquipo,
  calcularDeudaJugadora,
  deudaActual,
  estadoDeEvento,
  eximirJugadora,
  jugadoraInactivaSinDeudaFutura,
  puedeEliminarEvento,
  validarMontoEvento,
  validarNuevaJugadora,
  validarNuevoEvento,
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

describe("validarNuevoEvento", () => {
  const valido = { name: "  Cuota octubre ", type: "CUOTA", amount: "3000", dueDate: "2026-10-15" };

  it("con un body válido devuelve los datos normalizados", () => {
    const resultado = validarNuevoEvento(valido);

    expect(resultado).toEqual({
      ok: true,
      datos: { name: "Cuota octubre", type: "CUOTA", amount: 3000, dueDate: new Date("2026-10-15") },
    });
  });

  it.each([
    ["sin nombre", { name: "" }, "Nombre y fecha de vencimiento son obligatorios"],
    ["con nombre de solo espacios", { name: "   " }, "Nombre y fecha de vencimiento son obligatorios"],
    ["sin fecha", { dueDate: "" }, "Nombre y fecha de vencimiento son obligatorios"],
    ["con una fecha que no es fecha", { dueDate: "31/12/2026" }, "Nombre y fecha de vencimiento son obligatorios"],
    ["con un tipo inexistente", { type: "FIESTA" }, "Tipo de evento inválido: FIESTA"],
    ["con un tipo que hereda del prototipo", { type: "constructor" }, "Tipo de evento inválido: constructor"],
    ["con monto 0", { amount: 0 }, "El monto debe ser mayor a 0"],
    ["con monto negativo", { amount: -100 }, "El monto debe ser mayor a 0"],
    ["con monto no numérico", { amount: "abc" }, "El monto debe ser mayor a 0"],
  ])("rechaza un evento %s", (_caso, cambio, error) => {
    expect(validarNuevoEvento({ ...valido, ...cambio })).toEqual({ ok: false, error });
  });

  it("sin body no explota: pide nombre y fecha", () => {
    expect(validarNuevoEvento(undefined)).toEqual({
      ok: false,
      error: "Nombre y fecha de vencimiento son obligatorios",
    });
  });
});

// ---- Deuda actual (regla 1 + regla 6) y pendiente del equipo (dashboard) ----
describe("deudaActual y calcularPendienteEquipo", () => {
  // e1 se creó el 1/2. j2 se desactivó el 15/1, ANTES de que existiera e1.
  const activa = jugadora({ id: "j1" });
  const inactiva = jugadora({ id: "j2", active: false, deactivatedAt: new Date("2026-01-15") });
  const e1 = evento({ participants: [participante({ id: "p1", playerId: "j1" }), participante({ id: "p2", playerId: "j2" })] });
  const pagos = [pago({ eventParticipantId: "p1", amount: 400 })];

  it("una jugadora activa debe lo que le falta pagar", () => {
    expect(deudaActual(activa, [e1], pagos)).toBe(600);
  });

  it("una inactiva no debe eventos creados después de su desactivación", () => {
    expect(deudaActual(inactiva, [e1], pagos)).toBe(0);
  });

  it("el pendiente del equipo suma la deuda actual de todas (aplicando la regla 6)", () => {
    // Sin la regla 6 daría 1600: los 1000 de j2 se sumarían aunque ya no juega.
    expect(calcularPendienteEquipo([activa, inactiva], [e1], pagos)).toBe(600);
  });

  it("sin jugadoras el pendiente es 0", () => {
    expect(calcularPendienteEquipo([], [e1], pagos)).toBe(0);
  });
});

// ---- Alta y edición de jugadoras ----
describe("validarNuevaJugadora", () => {
  it("acepta un nombre y le saca los espacios de los costados", () => {
    expect(validarNuevaJugadora({ name: "  Ana  " })).toEqual({ ok: true, name: "Ana" });
  });

  it.each([
    ["vacío", { name: "" }],
    ["de solo espacios", { name: "   " }],
    ["ausente", {}],
    ["sin body", undefined],
  ])("rechaza un nombre %s", (_caso, body) => {
    expect(validarNuevaJugadora(body)).toEqual({ ok: false, error: "El nombre es obligatorio" });
  });
});

describe("armarCambiosJugadora", () => {
  const AHORA = new Date("2026-10-09T12:00:00.000Z");

  it("si solo viene el nombre, no toca el estado ni la fecha de desactivación", () => {
    expect(armarCambiosJugadora({ name: " Ana " }, AHORA)).toEqual({ ok: true, cambios: { name: "Ana" } });
  });

  it("no deja el nombre vacío", () => {
    expect(armarCambiosJugadora({ name: "  " }, AHORA)).toEqual({
      ok: false,
      error: "El nombre no puede quedar vacío",
    });
  });

  it("al desactivar guarda la fecha (la que usa la regla 6)", () => {
    expect(armarCambiosJugadora({ active: false }, AHORA)).toEqual({
      ok: true,
      cambios: { active: false, deactivatedAt: AHORA },
    });
  });

  it("al reactivar borra la fecha de desactivación", () => {
    expect(armarCambiosJugadora({ active: true }, AHORA)).toEqual({
      ok: true,
      cambios: { active: true, deactivatedAt: null },
    });
  });

  it("con un body vacío no cambia nada", () => {
    expect(armarCambiosJugadora({}, AHORA)).toEqual({ ok: true, cambios: {} });
  });

  it("sin body no explota (Express 5 deja req.body undefined si no viene JSON)", () => {
    expect(armarCambiosJugadora(undefined, AHORA)).toEqual({ ok: true, cambios: {} });
  });
});

// ---- Estado de cobro de un evento: un test por cada camino que declara la función ----
describe("estadoDeEvento", () => {
  // evento() vence el 1/3/2026 con una participante (p1) que no pagó.
  const ANTES = new Date("2026-02-20T00:00:00.000Z"); // faltan 9 días

  it("sin participantes que deban pagar → sin-participantes (también si todas están exentas)", () => {
    expect(estadoDeEvento(evento({ participants: [] }), [], ANTES)).toBe("sin-participantes");
    expect(estadoDeEvento(evento({ participants: [participante({ exempt: true })] }), [], ANTES)).toBe(
      "sin-participantes"
    );
  });

  it("si todas las que deben pagaron → cobrado (aunque ya haya vencido)", () => {
    const despues = new Date("2026-04-01T00:00:00.000Z");

    expect(estadoDeEvento(evento(), [pago()], despues)).toBe("cobrado");
  });

  it("si falta una sola, no está cobrado", () => {
    const dos = evento({ participants: [participante({ id: "p1" }), participante({ id: "p2", playerId: "j2" })] });

    expect(estadoDeEvento(dos, [pago({ eventParticipantId: "p1" })], ANTES)).toBe("pendiente");
  });

  // Los tres caminos que dependen de la fecha, con sus bordes (vence el 1/3 a las 00:00 UTC).
  it.each([
    ["un día después del vencimiento", "2026-03-02T00:00:00.000Z", "vencido"],
    ["un milisegundo después del vencimiento", "2026-03-01T00:00:00.001Z", "vencido"],
    ["el momento exacto del vencimiento", "2026-03-01T00:00:00.000Z", "vence-pronto"],
    ["a exactamente 3 días", "2026-02-26T00:00:00.000Z", "vence-pronto"],
    ["a 3 días y un milisegundo", "2026-02-25T23:59:59.999Z", "pendiente"],
    ["a 9 días", "2026-02-20T00:00:00.000Z", "pendiente"],
  ])("con deuda, %s → %s", (_caso, ahora, esperado) => {
    expect(estadoDeEvento(evento(), [], new Date(ahora))).toBe(esperado);
  });
});
