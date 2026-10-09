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
        // Recién después de sacar su lógica a rules.ts / mappers.ts / services/:
        "src/app.ts", // cablea Express: routers, JSON y el manejador de errores
        "src/routes/**", // handlers: piden a la base, delegan y traducen a HTTP
        "src/repos/**", // implementación real de PagosRepo (Prisma): se prueba de punta a punta en el TP7
      ],
      // Umbral (TP5 §3.3/3.4): medimos 100% de líneas y de ramas. No ponemos 100 para no
      // obligar a testear cada línea defensiva (Goodhart), pero sí cerca: si entra lógica
      // nueva sin tests (~10 líneas en el back), el número cae abajo y el build se pone rojo.
      // Funciones no tiene umbral: en el front, `traerReal` (el fetch real) queda sin test a propósito.
      thresholds: { lines: 90, branches: 85 },
    },
  },
});