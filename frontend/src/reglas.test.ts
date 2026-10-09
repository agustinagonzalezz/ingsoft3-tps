import { describe, expect, it } from "vitest";
import type { ParticipanteVM } from "./api";
import { contarPagos, mensajeDeError, nombreValido, puedeCrearEvento } from "./reglas";

describe("puedeCrearEvento", () => {
  it("con nombre, monto positivo y fecha se puede enviar", () => {
    expect(puedeCrearEvento("Cuota octubre", "3000", "2026-10-15")).toBe(true);
  });

  it.each([
    ["sin nombre", "", "3000", "2026-10-15"],
    ["con nombre de solo espacios", "   ", "3000", "2026-10-15"],
    ["con monto 0", "Cuota", "0", "2026-10-15"],
    ["con monto negativo", "Cuota", "-5", "2026-10-15"],
    ["con monto vacío", "Cuota", "", "2026-10-15"], // Number("") es 0
    ["con monto que no es número", "Cuota", "abc", "2026-10-15"],
    ["sin fecha", "Cuota", "3000", ""],
  ])("no deja enviar %s", (_caso, name, amount, dueDate) => {
    expect(puedeCrearEvento(name, amount, dueDate)).toBe(false);
  });

  it("acepta el monto mínimo con centavos (borde)", () => {
    expect(puedeCrearEvento("Cuota", "0.01", "2026-10-15")).toBe(true);
  });
});

describe("nombreValido", () => {
  it.each([
    ["Ana", true],
    ["  Ana  ", true],
    ["", false],
    ["   ", false],
  ])("«%s» → %s", (nombre, esperado) => {
    expect(nombreValido(nombre)).toBe(esperado);
  });
});

describe("contarPagos", () => {
  const participante = (id: string, exempt = false): ParticipanteVM => ({
    eventParticipantId: id,
    playerId: `j-${id}`,
    playerName: id,
    montoEsperado: 1000,
    exempt,
    pagada: false,
  });

  it("cuenta las que pagaron y las que faltan", () => {
    const resultado = contarPagos([participante("a"), participante("b"), participante("c")], { a: true });

    expect(resultado).toEqual({ pagaron: 1, faltan: 2 });
  });

  it("las exentas no cuentan ni como pagadas ni como faltantes", () => {
    const resultado = contarPagos([participante("a"), participante("b", true)], { a: false, b: true });

    expect(resultado).toEqual({ pagaron: 0, faltan: 1 });
  });

  it("sin participantes no falta nadie", () => {
    expect(contarPagos([], {})).toEqual({ pagaron: 0, faltan: 0 });
  });
});

describe("mensajeDeError", () => {
  it("de un Error usa su mensaje", () => {
    expect(mensajeDeError(new Error("Participación no encontrada"))).toBe("Participación no encontrada");
  });

  it("si lo que se lanzó no es un Error, lo pasa a texto", () => {
    expect(mensajeDeError("timeout")).toBe("timeout");
  });
});
