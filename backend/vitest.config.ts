import { defineConfig } from "vitest/config";

// Config de tests del backend (TP5).
// Los tests viven al lado del código: src/algo.ts -> src/algo.test.ts
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // text: tabla en consola · html: reporte navegable
      // json-summary: totales que el pipeline lee para el Summary
      reporter: ["text", "html", "json-summary"],
      // Qué ENTRA en la cuenta: todo src/ ...
      include: ["src/**/*.ts"],
      // ... menos lo que no es lógica mía (la lista se justifica en decisiones.md)
      exclude: [
        "src/**/*.test.ts", // los tests no se miden a sí mismos
        "src/generated/**", // cliente generado por `prisma generate`
        "src/index.ts", // arranque: lee PORT y llama a listen()
        "src/db.ts", // arma el PrismaClient con la URL del entorno
      ],
      // Umbral: TODAVÍA NO. Primero medimos, después elegimos el número.
    },
  },
});