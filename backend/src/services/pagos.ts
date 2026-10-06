// Lógica de "marcar como pagada" una participación (antes vivía adentro del
// handler de routes/participaciones.ts, pegada a Prisma).
//
// La función NO importa la base: recibe un `PagosRepo` por parámetro.
// En la app real le llega el repo de Prisma (repos/pagosPrisma.ts);
// en los tests le llega un doble hecho con vi.fn(). Eso es inyección de dependencias.

export type PagoRegistrado = {
  id: string;
  eventParticipantId: string;
  amount: number;
  paidAt: Date;
};

export type ParticipacionParaCobro = {
  id: string;
  exempt: boolean;
  amountOverride: number | null;
  montoEvento: number;
  pagos: PagoRegistrado[];
};

// El "contrato": QUÉ se le puede pedir a la base, no CÓMO se hace.
// (Es el equivalente del INotificador de la guía.)
export type PagosRepo = {
  buscarParticipacion(id: string): Promise<ParticipacionParaCobro | null>;
  crearPago(participacionId: string, monto: number): Promise<PagoRegistrado>;
};

export type ResultadoMarcarPago =
  | { tipo: "no-encontrada" }
  | { tipo: "exenta" }
  | { tipo: "ya-pagada"; pago: PagoRegistrado }
  | { tipo: "registrado"; pago: PagoRegistrado };

export async function marcarPago(repo: PagosRepo, participacionId: string): Promise<ResultadoMarcarPago> {
  const participacion = await repo.buscarParticipacion(participacionId);
  if (!participacion) return { tipo: "no-encontrada" };

  // Una jugadora exenta no paga: no se registra nada.
  if (participacion.exempt) return { tipo: "exenta" };

  // Idempotente: si ya pagó, se devuelve el pago existente y NO se crea otro.
  if (participacion.pagos.length > 0) return { tipo: "ya-pagada", pago: participacion.pagos[0] };

  // El monto lo decide el backend: el override de la jugadora o el del evento.
  const monto = participacion.amountOverride ?? participacion.montoEvento;
  const pago = await repo.crearPago(participacion.id, monto);
  return { tipo: "registrado", pago };
}