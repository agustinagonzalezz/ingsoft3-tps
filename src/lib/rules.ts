// Reglas de negocio como funciones puras — sin Prisma, sin Next.js.
// Los montos son `number` (no Decimal) a propósito: así se pueden testear
// con datos planos, sin construir objetos Decimal ni mockear la base.
// Los callers (services/route handlers) convierten Decimal -> number con
// `.toNumber()` antes de invocar estas funciones.

export type Jugadora = {
  id: string;
  active: boolean;
  createdAt: Date;
  // Fecha en la que se marcó inactiva. Requerida por la regla 6.
  deactivatedAt: Date | null;
};

export type ParticipanteEvento = {
  id: string;
  eventId: string;
  playerId: string;
  exempt: boolean;
  amountOverride: number | null;
};

export type Evento = {
  id: string;
  amount: number;
  dueDate: Date;
  createdAt: Date;
  participants: ParticipanteEvento[];
};

export type Pago = {
  eventParticipantId: string;
  amount: number;
  paidAt: Date;
};

export type Gasto = {
  amount: number;
  date: Date;
};

/**
 * Regla 1: deuda total de una jugadora = suma, por cada evento en el que
 * participa, de (monto esperado - pagos parciales recibidos), sin bajar de 0.
 * Se clampea por evento para que un pago de más en un evento no compense
 * la deuda de otro.
 */
export function calcularDeudaJugadora(
  player: Jugadora,
  events: Evento[],
  payments: Pago[]
): number {
  let deuda = 0;

  for (const event of events) {
    const participante = event.participants.find((p) => p.playerId === player.id);
    if (!participante || participante.exempt) continue;

    const montoEsperado = participante.amountOverride ?? event.amount;
    const pagado = payments
      .filter((pago) => pago.eventParticipantId === participante.id)
      .reduce((acc, pago) => acc + pago.amount, 0);

    deuda += Math.max(montoEsperado - pagado, 0);
  }

  return deuda;
}

/**
 * Regla 2: balance del equipo = recaudado (pagos) - gastos, opcionalmente
 * filtrado por rango de fechas (inclusive en ambos extremos).
 */
export function calcularBalanceEquipo(
  events: Evento[],
  payments: Pago[],
  expenses: Gasto[],
  desde?: Date,
  hasta?: Date
): { recaudado: number; gastos: number; balance: number } {
  const enRango = (fecha: Date) =>
    (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

  const recaudado = payments
    .filter((pago) => enRango(pago.paidAt))
    .reduce((acc, pago) => acc + pago.amount, 0);

  const gastos = expenses
    .filter((gasto) => enRango(gasto.date))
    .reduce((acc, gasto) => acc + gasto.amount, 0);

  return { recaudado, gastos, balance: recaudado - gastos };
}

/**
 * Regla 3: un evento con al menos un pago asociado no se puede eliminar,
 * para no perder el historial de cobros.
 */
export function puedeEliminarEvento(event: Evento, payments: Pago[]): boolean {
  const participantIds = new Set(event.participants.map((p) => p.id));
  const tienePagos = payments.some((pago) => participantIds.has(pago.eventParticipantId));
  return !tienePagos;
}

/**
 * Regla 4: el monto de un evento debe ser estrictamente positivo.
 */
export function validarMontoEvento(amount: number): boolean {
  return amount > 0;
}

/**
 * Regla 5: eximir a una jugadora de un evento puntual. Devuelve una copia
 * de la lista de participantes con `exempt: true` para ese par evento/jugadora
 * (crea el registro de participación si todavía no existía). Con esto,
 * `calcularDeudaJugadora` va a computar 0 para ese evento aunque no haya pagos.
 */
export function eximirJugadora(
  participants: ParticipanteEvento[],
  eventId: string,
  playerId: string
): ParticipanteEvento[] {
  const yaExiste = participants.some(
    (p) => p.eventId === eventId && p.playerId === playerId
  );

  if (!yaExiste) {
    return [
      ...participants,
      { id: `${eventId}:${playerId}`, eventId, playerId, exempt: true, amountOverride: null },
    ];
  }

  return participants.map((p) =>
    p.eventId === eventId && p.playerId === playerId ? { ...p, exempt: true } : p
  );
}

/**
 * Regla 6: una jugadora inactiva no debe seguir sumando deuda en eventos
 * creados después de su desactivación (su historial de pagos pasados no se
 * toca: esta función solo filtra qué eventos entran al cálculo de deuda).
 */
export function jugadoraInactivaSinDeudaFutura(player: Jugadora, events: Evento[]): Evento[] {
  if (player.active || !player.deactivatedAt) return events;

  const cutoff = player.deactivatedAt;
  return events.filter((event) => event.createdAt <= cutoff);
}
