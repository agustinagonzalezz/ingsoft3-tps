"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { eximirJugadora, puedeEliminarEvento, validarMontoEvento } from "@/lib/rules";
import type { EventType } from "@/generated/prisma/enums";

export async function crearEvento(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as EventType;
  const amount = Number(formData.get("amount"));
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!name || !dueDate || !validarMontoEvento(amount)) return;

  // Todas las jugadoras activas al momento de crear el evento quedan
  // enroladas como participantes (y por lo tanto, como deudoras).
  const jugadorasActivas = await db.player.findMany({ where: { active: true } });

  await db.event.create({
    data: {
      name,
      type,
      amount,
      dueDate: new Date(dueDate),
      participants: {
        create: jugadorasActivas.map((jugadora) => ({ playerId: jugadora.id })),
      },
    },
  });

  revalidatePath("/eventos");
}

export async function eliminarEvento(eventId: string) {
  const evento = await db.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { participants: true },
  });
  const pagos = await db.payment.findMany({
    where: { eventParticipant: { eventId } },
  });

  const puedeEliminar = puedeEliminarEvento(
    {
      ...evento,
      amount: evento.amount.toNumber(),
      participants: evento.participants.map((p) => ({
        ...p,
        amountOverride: p.amountOverride?.toNumber() ?? null,
      })),
    },
    pagos.map((p) => ({ ...p, amount: p.amount.toNumber() }))
  );
  if (!puedeEliminar) return;

  await db.event.delete({ where: { id: eventId } });
  revalidatePath("/eventos");
}

export async function marcarPago(eventParticipantId: string, montoEsperado: number) {
  await db.payment.create({
    data: { eventParticipantId, amount: montoEsperado },
  });
  revalidatePath("/eventos");
}

export async function desmarcarPago(eventParticipantId: string) {
  await db.payment.deleteMany({ where: { eventParticipantId } });
  revalidatePath("/eventos");
}

export async function eximirParticipante(eventId: string, playerId: string) {
  const participantesActuales = await db.eventParticipant.findMany({ where: { eventId } });
  const participantesNumericos = participantesActuales.map((p) => ({
    ...p,
    amountOverride: p.amountOverride?.toNumber() ?? null,
  }));

  // La lógica de "quién queda exenta" vive en lib/rules.ts (pura, testeable);
  // acá solo persistimos el resultado.
  const actualizado = eximirJugadora(participantesNumericos, eventId, playerId).find(
    (p) => p.eventId === eventId && p.playerId === playerId
  )!;

  await db.eventParticipant.upsert({
    where: { playerId_eventId: { playerId, eventId } },
    create: { playerId, eventId, exempt: true },
    update: { exempt: actualizado.exempt },
  });
  revalidatePath("/eventos");
}
