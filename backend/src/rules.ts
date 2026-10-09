// Reglas de negocio como funciones puras — sin Prisma, sin Express.
// Los montos son `number` (no Decimal) a propósito: así se pueden testear
// con datos planos, sin construir objetos Decimal ni mockear la base.
// Los callers (services/route handlers) convierten Decimal -> number con
// `.toNumber()` antes de invocar estas funciones.

import { EventType } from "./generated/prisma/enums.js"; // objeto plano generado, no el cliente de Prisma

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

/**
 * Alta de evento (antes vivía adentro del handler de POST /api/eventos):
 * valida y normaliza el body. Devuelve los datos listos para guardar o el
 * mensaje de error que ve el usuario. Para el monto reusa la regla 4.
 */
export type DatosEventoNuevo = { name: string; type: EventType; amount: number; dueDate: Date };
export type ValidacionEvento = { ok: true; datos: DatosEventoNuevo } | { ok: false; error: string };

export function validarNuevoEvento(body: unknown): ValidacionEvento {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  const type = String(b.type ?? "");
  const amount = Number(b.amount);
  const dueDate = String(b.dueDate ?? "");

  if (!name || !dueDate || Number.isNaN(Date.parse(dueDate))) {
    return { ok: false, error: "Nombre y fecha de vencimiento son obligatorios" };
  }
  // Object.hasOwn y no `type in EventType`: `in` también mira el prototipo,
  // así que "constructor" o "toString" pasaban como tipos válidos.
  if (!Object.hasOwn(EventType, type)) {
    return { ok: false, error: `Tipo de evento inválido: ${type}` };
  }
  if (!validarMontoEvento(amount)) {
    return { ok: false, error: "El monto debe ser mayor a 0" };
  }
  return { ok: true, datos: { name, type: type as EventType, amount, dueDate: new Date(dueDate) } };
}

/**
 * Deuda actual de una jugadora: la regla 1 aplicada solo sobre los eventos que
 * le corresponden según la regla 6. Antes esta composición estaba repetida en
 * GET /api/jugadoras y en GET /api/dashboard.
 */
export function deudaActual(player: Jugadora, events: Evento[], payments: Pago[]): number {
  return calcularDeudaJugadora(player, jugadoraInactivaSinDeudaFutura(player, events), payments);
}

/** Pendiente del equipo (dashboard): la suma de la deuda actual de todas las jugadoras. */
export function calcularPendienteEquipo(players: Jugadora[], events: Evento[], payments: Pago[]): number {
  return players.reduce((acc, j) => acc + deudaActual(j, events, payments), 0);
}

/** Alta de jugadora (antes en POST /api/jugadoras): el nombre es obligatorio. */
export function validarNuevaJugadora(body: unknown): { ok: true; name: string } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = String(b.name ?? "").trim();
  if (!name) return { ok: false, error: "El nombre es obligatorio" };
  return { ok: true, name };
}

export type CambiosJugadora = { name?: string; active?: boolean; deactivatedAt?: Date | null };

/**
 * Edición de jugadora (antes en PATCH /api/jugadoras/:id): solo cambia lo que
 * viene en el body. Al desactivar guarda la fecha (la usa la regla 6) y al
 * reactivar la borra. `ahora` entra por parámetro para poder testear la fecha
 * sin depender del reloj.
 */
export function armarCambiosJugadora(
  body: unknown,
  ahora: Date
): { ok: true; cambios: CambiosJugadora } | { ok: false; error: string } {
  const { name, active } = (body ?? {}) as Record<string, unknown>;
  const cambios: CambiosJugadora = {};

  if (name !== undefined) {
    const nombre = String(name).trim();
    if (!nombre) return { ok: false, error: "El nombre no puede quedar vacío" };
    cambios.name = nombre;
  }
  if (active !== undefined) {
    cambios.active = Boolean(active);
    cambios.deactivatedAt = cambios.active ? null : ahora;
  }
  return { ok: true, cambios };
}

export type EstadoEvento = "sin-participantes" | "cobrado" | "vencido" | "vence-pronto" | "pendiente";

/**
 * Estado de cobro de un evento, para mostrarlo en la lista:
 * - sin-participantes: nadie tiene que pagarlo.
 * - cobrado: todas las participantes no exentas tienen al menos un pago.
 * - vencido: falta cobrar y la fecha de vencimiento ya pasó.
 * - vence-pronto: falta cobrar y vence dentro de los próximos 3 días.
 * - pendiente: falta cobrar y todavía hay tiempo.
 * `ahora` entra por parámetro para no depender del reloj.
 */
export function estadoDeEvento(event: Evento, payments: Pago[], ahora: Date): EstadoEvento {
  const deben = event.participants.filter((p) => !p.exempt);
  if (deben.length === 0) {
    return "sin-participantes";
  }

  const pagaron = new Set(payments.map((pago) => pago.eventParticipantId));
  const faltan = deben.filter((p) => !pagaron.has(p.id));
  if (faltan.length === 0) {
    return "cobrado";
  }

  const diasParaVencer = (event.dueDate.getTime() - ahora.getTime()) / 86_400_000;
  if (diasParaVencer < 0) {
    return "vencido";
  }
  if (diasParaVencer <= 3) {
    return "vence-pronto";
  }
  return "pendiente";
}
