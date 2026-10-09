import { formatCurrency } from "./format";

// Texto del recordatorio de pago para mandarle a una jugadora por el chat del equipo.
// (TP5 §3.5, PR 2: código nuevo SIN tests, a propósito, para mostrar el freno por cobertura.)
export function mensajeRecordatorio(nombre: string, deuda: number, diasVencida: number): string {
  const quien = nombre.trim() || "jugadora";
  if (deuda <= 0) {
    return `¡Gracias ${quien}! Estás al día.`;
  }

  const monto = formatCurrency(deuda);
  if (diasVencida <= 0) {
    return `Hola ${quien}, te recordamos que tenés ${monto} pendientes.`;
  }
  if (diasVencida < 30) {
    const dias = diasVencida === 1 ? "día" : "días";
    return `Hola ${quien}, tenés ${monto} vencidos hace ${diasVencida} ${dias}.`;
  }
  return `Hola ${quien}, tenés ${monto} vencidos hace más de un mes. Hablá con la tesorería.`;
}
