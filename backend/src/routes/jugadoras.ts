import { Router } from "express";
import { db } from "../db.js";
import { armarCambiosJugadora, deudaActual, validarNuevaJugadora } from "../rules.js";
import { toEvento, toPago } from "../mappers.js";

export const jugadorasRouter = Router();

// GET /api/jugadoras — lista con la deuda ya calculada (reglas 1 y 6).
jugadorasRouter.get("/", async (_req, res) => {
  const [jugadoras, eventos, pagos] = await Promise.all([
    db.player.findMany({ orderBy: { createdAt: "asc" } }),
    db.event.findMany({ include: { participants: true } }),
    db.payment.findMany(),
  ]);
  const eventosNum = eventos.map(toEvento);
  const pagosNum = pagos.map(toPago);

  res.json(
    jugadoras.map((j) => ({
      id: j.id,
      name: j.name,
      active: j.active,
      deuda: deudaActual(j, eventosNum, pagosNum),
    }))
  );
});

// POST /api/jugadoras { name }
jugadorasRouter.post("/", async (req, res) => {
  const validacion = validarNuevaJugadora(req.body);
  if (!validacion.ok) {
    res.status(400).json({ error: validacion.error });
    return;
  }
  const jugadora = await db.player.create({ data: { name: validacion.name } });
  res.status(201).json(jugadora);
});

// PATCH /api/jugadoras/:id { name?, active? }
// Qué se cambia (y la fecha de desactivación) lo decide rules.ts; acá se traduce y se guarda.
jugadorasRouter.patch("/:id", async (req, res) => {
  const resultado = armarCambiosJugadora(req.body, new Date());
  if (!resultado.ok) {
    res.status(400).json({ error: resultado.error });
    return;
  }
  const jugadora = await db.player.update({ where: { id: req.params.id }, data: resultado.cambios });
  res.json(jugadora);
});
