// TP7 — Suite END-TO-END (la punta de la pirámide).
//
// Un navegador de verdad (Chromium) usa la app como una persona: entra al front de QA, llena el
// formulario, clickea, y mira lo que aparece en pantalla. Por detrás pasa TODO: nginx del front,
// la api de QA y su base. Nada mockeado: si el navegador no le llega a la api, el test falla.
//
// Corre con:  E2E_BASE_URL=https://teampay-front-qa.onrender.com npx playwright test e2e/eventos.spec.ts
import { expect, test, type Page } from "@playwright/test";

type Evento = { id: string; name: string; participantes: { eventParticipantId: string; pagada: boolean }[] };

const nombreUnico = (prefijo: string) => `${prefijo} ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// Busca como una persona: por el nombre de cada control (aria-label), no por clases de CSS.
async function crearEvento(page: Page, nombre: string, monto: string) {
  await page.goto("/eventos");
  await page.getByLabel("Nombre del evento").fill(nombre);
  await page.getByLabel("Monto").fill(monto);
  await page.getByLabel("Fecha de vencimiento").fill("2099-12-31");
  await page.getByRole("button", { name: "Crear evento" }).click();
}

// La tarjeta de UN evento (cada tarjeta es un <article> con el nombre del evento).
const tarjeta = (page: Page, nombre: string) => page.getByRole("article", { name: nombre, exact: true });

// Red de seguridad: si un test falla a la mitad, lo que creó se borra igual, por la api.
// (El `request` usa la misma dirección del front: nginx reenvía /api a la api de QA.)
const creados: string[] = [];
test.afterEach(async ({ request }) => {
  const eventos: Evento[] = await (await request.get("/api/eventos")).json();
  for (const evento of eventos.filter((e) => creados.includes(e.name))) {
    for (const p of evento.participantes.filter((p) => p.pagada)) {
      await request.delete(`/api/participaciones/${p.eventParticipantId}/pago`);
    }
    await request.delete(`/api/eventos/${evento.id}`);
  }
  creados.length = 0;
});

test("crear un evento lo muestra en la lista, y eliminarlo lo saca", async ({ page }) => {
  const nombre = nombreUnico("e2e alta");
  creados.push(nombre);

  await crearEvento(page, nombre, "1500");
  await expect(tarjeta(page, nombre)).toBeVisible(); // el evento que ESTE test creó, sin sleeps

  await page.reload(); // no es sólo la pantalla: después de recargar sigue ahí (lo guardó la base)
  await expect(tarjeta(page, nombre)).toBeVisible();

  await page.getByRole("button", { name: `Eliminar evento ${nombre}` }).click();
  await expect(tarjeta(page, nombre)).toHaveCount(0); // y el borrado, comprobado…
  await page.reload();
  await expect(tarjeta(page, nombre)).toHaveCount(0); // …también en la base
});

test("un monto más grande que el máximo muestra el error y no crea nada", async ({ page }) => {
  const nombre = nombreUnico("e2e monto enorme");
  creados.push(nombre);

  // El front lo deja enviar (sólo exige monto > 0); el que lo rechaza es el back.
  await crearEvento(page, nombre, "1000000000");

  await expect(page.getByRole("alert")).toContainText("no puede superar"); // la persona ve el motivo…
  await expect(tarjeta(page, nombre)).toHaveCount(0); // …y en la lista no apareció nada
  await page.reload();
  await expect(tarjeta(page, nombre)).toHaveCount(0);
});

test("cobrar una cuota queda guardado, y con el pago el evento no se puede eliminar", async ({ page }) => {
  // El flujo de todos los días: marcar que una jugadora pagó. Si mañana no anda, te escriben.
  const nombre = nombreUnico("e2e cobro");
  creados.push(nombre);

  await crearEvento(page, nombre, "1500");
  const evento = tarjeta(page, nombre);
  const pago = evento.getByRole("checkbox").first(); // la primera jugadora enrolada
  await expect(pago, "QA necesita al menos una jugadora activa").toBeVisible();
  await expect(evento).toContainText("0 pagaron");

  await pago.check();
  await expect(evento).toContainText("1 pagaron");
  // Regla 3, vista desde la pantalla: con un pago, el botón de eliminar desaparece.
  await expect(evento.getByRole("button", { name: `Eliminar evento ${nombre}` })).toHaveCount(0);

  await page.reload(); // el pago lo guardó la base, no sólo el estado de la pantalla
  await expect(tarjeta(page, nombre).getByRole("checkbox").first()).toBeChecked();

  // Limpieza por la misma pantalla: se desmarca el pago y entonces sí se puede eliminar.
  await tarjeta(page, nombre).getByRole("checkbox").first().uncheck();
  const eliminar = tarjeta(page, nombre).getByRole("button", { name: `Eliminar evento ${nombre}` });
  await expect(eliminar).toBeVisible();
  await eliminar.click();
  await expect(tarjeta(page, nombre)).toHaveCount(0);
});
