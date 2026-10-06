import { describe, it, expect, vi } from "vitest";
import { marcarPago, type ParticipacionParaCobro, type PagosRepo, type PagoRegistrado } from "./pagos.js";

// ---- Datos de prueba ----
const participacion = (over: Partial<ParticipacionParaCobro> = {}): ParticipacionParaCobro => ({
  id: "p1",
  exempt: false,
  amountOverride: null,
  montoEvento: 1000,
  pagos: [],
  ...over,
});

const pagoGuardado: PagoRegistrado = {
  id: "pago1",
  eventParticipantId: "p1",
  amount: 1000,
  paidAt: new Date("2026-10-01"),
};

// ---- El doble del repo ----
// buscarParticipacion actúa como STUB: solo devuelve un dato fijo.
// crearPago actúa como MOCK: los tests verifican CÓMO se lo llamó.
function repoFalso(encontrada: ParticipacionParaCobro | null) {
  return {
    buscarParticipacion: vi.fn().mockResolvedValue(encontrada),
    crearPago: vi.fn().mockResolvedValue(pagoGuardado),
  } satisfies PagosRepo;
}

describe("marcarPago", () => {
  it("registra un único pago por el monto del evento", async () => {
    // Arrange
    const repo = repoFalso(participacion());

    // Act
    const resultado = await marcarPago(repo, "p1");

    // Assert: mira la INTERACCIÓN con la dependencia (el equivalente del Verify de Moq)
    expect(repo.crearPago).toHaveBeenCalledTimes(1);
    expect(repo.crearPago).toHaveBeenCalledWith("p1", 1000);
    expect(resultado).toEqual({ tipo: "registrado", pago: pagoGuardado });
  });

  it("cobra el monto personalizado de la jugadora si tiene uno", async () => {
    const repo = repoFalso(participacion({ amountOverride: 600 }));

    await marcarPago(repo, "p1");

    expect(repo.crearPago).toHaveBeenCalledWith("p1", 600);
  });

  it("no registra ningún pago si la jugadora está exenta", async () => {
    const repo = repoFalso(participacion({ exempt: true }));

    const resultado = await marcarPago(repo, "p1");

    expect(resultado.tipo).toBe("exenta");
    expect(repo.crearPago).not.toHaveBeenCalled();
  });

  it("si ya estaba pagada devuelve el pago existente y no crea otro", async () => {
    const repo = repoFalso(participacion({ pagos: [pagoGuardado] }));

    const resultado = await marcarPago(repo, "p1");

    expect(resultado).toEqual({ tipo: "ya-pagada", pago: pagoGuardado });
    expect(repo.crearPago).not.toHaveBeenCalled();
  });

  it("informa que no existe una participación inexistente", async () => {
    const repo = repoFalso(null);

    const resultado = await marcarPago(repo, "no-existe");

    expect(resultado.tipo).toBe("no-encontrada");
    expect(repo.crearPago).not.toHaveBeenCalled();
  });
});