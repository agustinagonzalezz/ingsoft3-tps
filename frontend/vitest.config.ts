import { defineConfig } from "vitest/config";

// Config de tests del FRONTEND (TP5). Mismo criterio que backend/vitest.config.ts.
// Tests sin DOM: la lógica que estaba en los componentes se sacó a reglas.ts.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Qué entra en la cuenta: toda la lógica (.ts), la de hoy y la que se agregue mañana.
      // Con archivos sueltos, un archivo nuevo sin tests no se contaría y el umbral no lo vería.
      // Los componentes y páginas (.tsx) son render de React: se verifican de punta a punta (TP7).
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts", // los tests no se miden a sí mismos
        "src/useApi.ts", // hook de React: necesita DOM para correr
      ],
      // Umbral (TP5 §3.3/3.4): medimos 100% de líneas y de ramas. No ponemos 100 para no
      // obligar a testear cada línea defensiva (Goodhart), pero sí cerca: si entra lógica
      // nueva sin tests (~10 líneas en el back), el número cae abajo y el build se pone rojo.
      // Funciones no tiene umbral: en el front, `traerReal` (el fetch real) queda sin test a propósito.
      thresholds: { lines: 90, branches: 85 },
    },
  },
});
