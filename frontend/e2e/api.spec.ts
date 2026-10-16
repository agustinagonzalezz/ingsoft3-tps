// TP7 — Suite de INTEGRACIÓN (el escalón del medio de la pirámide).
//
// Le habla a la API DESPLEGADA de QA por su dirección pública, con su base de datos de verdad
// detrás. Sin navegador (el fixture `request` es un cliente HTTP) y sin ningún doble en el medio:
// lo que contesta es lo que pasa de verdad en Postgres, no lo que uno le dijo a un mock.
//
// Corre con:  API_BASE_URL=https://teampay-api-qa.onrender.com npx playwright test e2e/api.spec.ts
import { expect, test, type APIRequestContext } from "@playwright/test";

// La API tiene su propia dirección: NO es la del front. Sin barra al final.
const API = process.env.API_BASE_URL || "http://localhost:8080";

type Participante = { eventParticipantId: string; playerName: string; exempt: boolean; pagada: boolean };
type Evento = { id: string; name: string; puedeEliminar: boolean; participantes: Participante[] };

// Un nombre que no se repite: la hora (y un sufijo al azar, por si el reintento cae en el mismo ms).
// QA es uno solo y lo comparten todas las corridas: así ningún test se cruza con datos de otro.
const nombreUnico = (prefijo: string) => `${prefijo} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// Un evento válido. Vence en 2099 para que nunca cuente como deuda vencida de nadie.
const nuevoEvento = (name: string, amount = 1500) => ({ name, type: "CUOTA", amount, dueDate: "2099-12-31" });

async function listar(request: APIRequestContext): Promise<Evento[]> {
  const r = await request.get(`${API}/api/eventos`);
  expect(r.status()).toBe(200);
  return r.json();
}

// Red de seguridad: si un test falla a la mitad, lo que creó se borra igual (primero los pagos,
// porque la regla 3 no deja borrar un evento cobrado). Cada test, además, borra lo suyo y lo comprueba.
const creados: string[] = [];
test.afterEach(async ({ request }) => {
  const eventos = await listar(request);
  for (const evento of eventos.filter((e) => creados.includes(e.id))) {
    for (const p of evento.participantes.filter((p) => p.pagada)) {
      await request.delete(`${API}/api/participaciones/${p.eventParticipantId}/pago`);
    }
    await request.delete(`${API}/api/eventos/${evento.id}`);
  }
  creados.length = 0;
});

test("el alta guarda el evento en la base de verdad, y el borrado lo saca", async ({ request }) => {
  const nombre = nombreUnico("api alta");

  const alta = await request.post(`${API}/api/eventos`, { data: nuevoEvento(nombre) });
  expect(alta.status()).toBe(201); // la api dice «creado»…
  const { id } = await alta.json();
  creados.push(id);

  // …y la BASE lo devuelve: el GET le pregunta a Postgres, no a un doble.
  expect((await listar(request)).some((e) => e.id === id && e.name === nombre)).toBe(true);

  const borrado = await request.delete(`${API}/api/eventos/${id}`);
  expect(borrado.status()).toBe(204); // «borrado, no hay nada que devolver»

  expect((await listar(request)).some((e) => e.id === id)).toBe(false); // y el borrado, comprobado
});

test("un evento sin nombre lo rechaza la api con 400, y no crea nada", async ({ request }) => {
  const antes = await listar(request);

  const alta = await request.post(`${API}/api/eventos`, { data: nuevoEvento("") });
  expect(alta.status()).toBe(400); // el contrato del error…
  expect((await alta.json()).error).toContain("obligatorio"); // …con un motivo que se puede mostrar

  const despues = await listar(request);
  expect(despues.length).toBe(antes.length); // y de verdad no se creó nada
});

test("un monto que no entra en la columna de la base lo rechaza con 400, y no crea nada", async ({ request }) => {
  // La columna es Decimal(10,2): entra hasta 99.999.999,99. Este límite lo pone POSTGRES:
  // un unitario con un doble acepta cualquier número. Antes de este TP la api contestaba 500.
  const nombre = nombreUnico("api monto enorme");

  const alta = await request.post(`${API}/api/eventos`, { data: nuevoEvento(nombre, 100_000_000) });
  expect(alta.status()).toBe(400);
  expect((await alta.json()).error).toContain("no puede superar");

  expect((await listar(request)).some((e) => e.name === nombre)).toBe(false);
});

test("un evento con un pago cobrado no se puede borrar (409) hasta desmarcar el pago", async ({ request }) => {
  // El flujo de todos los días: cobrar una cuota. Pasa por tres tablas (Event, EventParticipant,
  // Payment) y por la regla 3: un evento con pagos no se borra, para no perder el historial.
  const nombre = nombreUnico("api cobro");
  const alta = await request.post(`${API}/api/eventos`, { data: nuevoEvento(nombre) });
  expect(alta.status()).toBe(201);
  const { id } = await alta.json();
  creados.push(id);

  // Al crearse, el evento enrola a todas las jugadoras activas de QA.
  const evento = (await listar(request)).find((e) => e.id === id)!;
  expect(evento.participantes.length, "QA necesita al menos una jugadora activa").toBeGreaterThan(0);
  const participacion = evento.participantes[0].eventParticipantId;

  const cobro = await request.put(`${API}/api/participaciones/${participacion}/pago`);
  expect(cobro.status()).toBe(201); // pago registrado en la base

  const borrarCobrado = await request.delete(`${API}/api/eventos/${id}`);
  expect(borrarCobrado.status()).toBe(409); // la regla 3, con la base de verdad
  expect((await listar(request)).find((e) => e.id === id)?.puedeEliminar).toBe(false); // y sigue ahí

  const desmarcar = await request.delete(`${API}/api/participaciones/${participacion}/pago`);
  expect(desmarcar.status()).toBe(204);

  const borrado = await request.delete(`${API}/api/eventos/${id}`);
  expect(borrado.status()).toBe(204); // sin pagos, ahora sí

  expect((await listar(request)).some((e) => e.id === id)).toBe(false);
});
