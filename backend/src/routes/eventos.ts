import { Router } from "express";
import { db } from "../db.js";
import { eximirJugadora, puedeEliminarEvento, validarNuevoEvento } from "../rules.js";
import { toEvento, toEventoVM, toPago, toParticipante } from "../mappers.js";

export const eventosRouter = Router();

// GET /api/eventos — cada evento con sus participantes ya "armados" para la UI.
eventosRouter.get("/", async (_req, res) => {
  const eventos = await db.event.findMany({
    orderBy: { dueDate: "asc" },
    include: { participants: { include: { player: true, payments: true } } },
  });

  res.json(eventos.map(toEventoVM));
});

// POST /api/eventos { name, type, amount, dueDate }
eventosRouter.post("/", async (req, res) => {
  // Validación y normalización en rules.ts (pura, testeable): acá solo se traduce a HTTP.
  const validacion = validarNuevoEvento(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }
  const { name, type, amount, dueDate } = validacion.datos;

  // Todas las jugadoras activas al momento de crear el evento quedan
  // enroladas como participantes (y por lo tanto, como deudoras).
  const activas = await db.player.findMany({ where: { active: true } });
  const evento = await db.event.create({
    data: {
      name,
      type,
      amount,
      dueDate,
      participants: { create: activas.map((j) => ({ playerId: j.id })) },
    },
  });
  res.status(201).json({ ...evento, amount: evento.amount.toNumber() });
});

// DELETE /api/eventos/:id — regla 3: no se borra si tiene pagos (409).
eventosRouter.delete("/:id", async (req, res) => {
  const evento = await db.event.findUnique({
    where: { id: req.params.id },
    include: { participants: true },
  });
  if (!evento) {
    res.status(404).json({ error: "Evento no encontrado" });
    return;
  }
  const pagos = await db.payment.findMany({ where: { eventParticipant: { eventId: evento.id } } });

  if (!puedeEliminarEvento(toEvento(evento), pagos.map(toPago))) {
    res.status(409).json({ error: "El evento tiene pagos registrados y no se puede eliminar" });
    return;
  }
  await db.event.delete({ where: { id: evento.id } });
  res.status(204).end();
});

// POST /api/eventos/:eventId/eximir/:playerId — regla 5.
eventosRouter.post("/:eventId/eximir/:playerId", async (req, res) => {
  const { eventId, playerId } = req.params;
  const actuales = await db.eventParticipant.findMany({ where: { eventId } });
  const numericos = actuales.map(toParticipante);

  // La lógica de "quién queda exenta" vive en rules.ts (pura, testeable);
  // acá solo persistimos el resultado.
  const actualizado = eximirJugadora(numericos, eventId, playerId).find(
    (p) => p.eventId === eventId && p.playerId === playerId
  )!;

  const participante = await db.eventParticipant.upsert({
    where: { playerId_eventId: { playerId, eventId } },
    create: { playerId, eventId, exempt: true },
    update: { exempt: actualizado.exempt },
  });
  res.json(participante);
});
