import { defineConfig } from "vitest/config";

// Config de tests del FRONTEND (TP5). Mismo criterio que backend/vitest.config.ts.
// Tests sin DOM: la lógica que estaba en los componentes se sacó a reglas.ts.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Acá no se excluye: se dice qué SÍ entra en la cuenta (la lista se justifica en decisiones.md).
      // Componentes, páginas, el hook y el arranque son render de React: se verifican de punta a punta (TP7).
      include: ["src/api.ts", "src/format.ts", "src/reglas.ts"],
      // Umbral: todavía no (§3.3). Primero medimos.
    },
  },
});
