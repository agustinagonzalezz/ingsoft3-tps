import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "./format";

// Intl separa "$" del número con un espacio NO separable (U+00A0).
// Lo normalizamos a espacio común para que el test se lea como lo ve el usuario.
const normalizar = (s: string) => s.replace(/\s/g, " ");

describe("formatCurrency", () => {
  it.each<[number, string]>([
    [1500, "$ 1.500"],
    [0, "$ 0"],
    [1234567, "$ 1.234.567"],
    [1500.6, "$ 1.501"], // sin decimales: redondea, no trunca
  ])("formatea %d como %s", (monto, esperado) => {
    expect(normalizar(formatCurrency(monto))).toBe(esperado);
  });
});

describe("formatDate", () => {
  it("muestra el mismo día que se cargó aunque sea medianoche UTC", () => {
    // Borde del bug que ya tuvimos: en UTC-3, sin timeZone "UTC" esto salía 14 oct.
    // Ojo: en una máquina en UTC (como el runner del CI) pasaría igual sin el arreglo.
    expect(formatDate("2026-10-15T00:00:00.000Z")).toBe("15 oct 2026");
  });

  it("da lo mismo pasarle un Date o el string ISO del JSON", () => {
    const iso = "2026-01-01T00:00:00.000Z";
    expect(formatDate(new Date(iso))).toBe(formatDate(iso));
  });

  it("lanza un error si la fecha no es válida", () => {
    expect(() => formatDate("no-es-fecha")).toThrow(RangeError);
  });
});
