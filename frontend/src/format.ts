export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}

// timeZone UTC: dueDate se guarda como medianoche UTC; sin esto, en Argentina
// (UTC-3) el navegador mostraba el día anterior al cargado.
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}
