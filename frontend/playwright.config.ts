import { defineConfig } from "@playwright/test";

// TP7: una sola herramienta para las DOS suites, en e2e/:
//   - e2e/api.spec.ts      -> integración: le habla a la API de verdad (sin navegador, fixture `request`)
//   - e2e/eventos.spec.ts  -> e2e: un navegador de verdad usa el front
// Cada job del pipeline corre SU archivo por nombre.
//
// Las direcciones NO están escritas acá: llegan por variables de entorno, y cada job apunta a QA.
//   - E2E_BASE_URL: el FRONT (lo usa eventos.spec.ts)
//   - API_BASE_URL: la API (lo lee api.spec.ts)
// Sin variables, apuntan al docker compose local (front en 3000, api en 8080).
export default defineConfig({
  testDir: "./e2e",
  // Tope de CADA test: generoso porque QA es free tier y puede estar despertando.
  timeout: 60_000,
  // Tope de CADA aserción (no lo hereda del de arriba; el default es 5 s).
  // Playwright reintenta la aserción hasta este tope: así se espera, sin sleeps.
  expect: { timeout: 15_000 },
  // Un reintento: absorbe una demora suelta de la red. Un test que pasa recién en el
  // reintento sale como «flaky» en el reporte: hay que mirarlo aunque la corrida esté verde.
  retries: 1,
  // Un test por vez: QA es uno solo y su base la comparten todos los tests. Dos tests en
  // paralelo podrían verse los datos entre sí (por ejemplo, contar eventos mientras otro crea).
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry", // la traza se graba en el reintento de un test que falló
    screenshot: "only-on-failure", // captura de cada fallo, en el reporte
  },
  reporter: [["html", { open: "never" }], ["list"]],
});
