import { describe, expect, it, vi } from "vitest";
import { crearApi, request, type Traer } from "./api";

// Fabrica una respuesta HTTP falsa con lo único que `request` usa de Response:
// ok, status y json(). Sin body, json() falla como falla con un body vacío.
function respuesta(status: number, body?: unknown) {
  const json =
    body === undefined
      ? vi.fn().mockRejectedValue(new SyntaxError("Unexpected end of JSON input"))
      : vi.fn().mockResolvedValue(body);
  const res = { ok: status >= 200 && status < 300, status, json } as unknown as Response;
  return { res, json };
}

describe("request", () => {
  it("le pide al cliente la URL con /api, el método, el body y el Content-Type", async () => {
    // Arrange: el impostor del fetch contesta 201
    const traer = vi.fn<Traer>().mockResolvedValue(respuesta(201, { id: "j1" }).res);

    // Act
    await request(traer, "/jugadoras", { method: "POST", body: JSON.stringify({ name: "Ana" }) });

    // Assert: no miramos lo que devolvió, miramos QUÉ le pidió a la red (el Verify de Moq)
    expect(traer).toHaveBeenCalledTimes(1);
    expect(traer).toHaveBeenCalledWith("/api/jugadoras", {
      method: "POST",
      body: '{"name":"Ana"}',
      headers: { "Content-Type": "application/json" },
    });
  });

  it("en un pedido sin body no manda Content-Type", async () => {
    const traer = vi.fn<Traer>().mockResolvedValue(respuesta(200, []).res);

    await request(traer, "/dashboard");

    expect(traer).toHaveBeenCalledWith("/api/dashboard", { headers: undefined });
  });

  it("devuelve el JSON del backend cuando la respuesta es 2xx", async () => {
    const dashboard = { recaudado: 1000, pendiente: 500, gastos: 0, balance: 1000 };
    const traer = vi.fn<Traer>().mockResolvedValue(respuesta(200, dashboard).res);

    const resultado = await request(traer, "/dashboard");

    expect(resultado).toEqual(dashboard);
  });

  // Caso de error, parametrizado: lo que el usuario ve en el ErrorBanner sale de acá.
  it.each([
    { status: 404, body: { error: "Participación no encontrada" }, mensaje: "Participación no encontrada" },
    { status: 409, body: { error: "La jugadora está exenta de este evento" }, mensaje: "La jugadora está exenta de este evento" },
    { status: 500, body: undefined, mensaje: "Error 500" }, // body que no es JSON: mensaje genérico
  ])("con un $status lanza «$mensaje»", async ({ status, body, mensaje }) => {
    const traer = vi.fn<Traer>().mockResolvedValue(respuesta(status, body).res);

    await expect(request(traer, "/participaciones/p1/pago", { method: "PUT" })).rejects.toThrow(mensaje);
  });

  it("con un 204 devuelve undefined y no intenta leer el body", async () => {
    const { res, json } = respuesta(204);
    const traer = vi.fn<Traer>().mockResolvedValue(res);

    const resultado = await request(traer, "/participaciones/p1/pago", { method: "DELETE" });

    expect(resultado).toBeUndefined();
    expect(json).not.toHaveBeenCalled(); // un 204 no tiene body: leerlo explotaría
  });
});

// El contrato con el backend: cada método pide la ruta y el método HTTP correctos.
// Si mañana alguien cambia una ruta sin querer, su fila se pone en rojo.
describe("crearApi", () => {
  const JSON_HEADERS = { "Content-Type": "application/json" };

  it.each([
    ["getDashboard", (a: ReturnType<typeof crearApi>) => a.getDashboard(), "/api/dashboard", undefined, undefined],
    ["getJugadoras", (a: ReturnType<typeof crearApi>) => a.getJugadoras(), "/api/jugadoras", undefined, undefined],
    ["crearJugadora", (a: ReturnType<typeof crearApi>) => a.crearJugadora("Ana"), "/api/jugadoras", "POST", '{"name":"Ana"}'],
    ["editarJugadora", (a: ReturnType<typeof crearApi>) => a.editarJugadora("j1", { active: false }), "/api/jugadoras/j1", "PATCH", '{"active":false}'],
    ["getEventos", (a: ReturnType<typeof crearApi>) => a.getEventos(), "/api/eventos", undefined, undefined],
    ["crearEvento", (a: ReturnType<typeof crearApi>) => a.crearEvento({ name: "Cuota", type: "CUOTA", amount: 3000, dueDate: "2026-10-15" }), "/api/eventos", "POST", '{"name":"Cuota","type":"CUOTA","amount":3000,"dueDate":"2026-10-15"}'],
    ["eliminarEvento", (a: ReturnType<typeof crearApi>) => a.eliminarEvento("e1"), "/api/eventos/e1", "DELETE", undefined],
    ["eximir", (a: ReturnType<typeof crearApi>) => a.eximir("e1", "j1"), "/api/eventos/e1/eximir/j1", "POST", undefined],
    ["marcarPago", (a: ReturnType<typeof crearApi>) => a.marcarPago("p1"), "/api/participaciones/p1/pago", "PUT", undefined],
    ["desmarcarPago", (a: ReturnType<typeof crearApi>) => a.desmarcarPago("p1"), "/api/participaciones/p1/pago", "DELETE", undefined],
  ])("%s pide su ruta y su método", async (_nombre, llamar, url, method, body) => {
    const traer = vi.fn<Traer>().mockResolvedValue(respuesta(200, {}).res);

    await llamar(crearApi(traer));

    expect(traer).toHaveBeenCalledWith(url, {
      ...(method && { method }),
      ...(method && { body }),
      headers: body ? JSON_HEADERS : undefined,
    });
  });
});
