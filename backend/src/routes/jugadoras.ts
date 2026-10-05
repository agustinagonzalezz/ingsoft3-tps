import { Router } from "express";
import { db } from "../db.js";
import { calcularDeudaJugadora, jugadoraInactivaSinDeudaFutura } from "../rules.js";
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
      deuda: calcularDeudaJugadora(j, jugadoraInactivaSinDeudaFutura(j, eventosNum), pagosNum),
    }))
  );
});

// POST /api/jugadoras { name }
jugadorasRouter.post("/", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) {
    res.status(400).json({ error: "El nombre es obligatorio" });
    return;
  }
  const jugadora = await db.player.create({ data: { name } });
  res.status(201).json(jugadora);
});

// PATCH /api/jugadoras/:id { name?, active? }
jugadorasRouter.patch("/:id", async (req, res) => {
  const { name, active } = req.body ?? {};
  const data: { name?: string; active?: boolean; deactivatedAt?: Date | null } = {};

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) {
      res.status(400).json({ error: "El nombre no puede quedar vacío" });
      return;
    }
    data.name = trimmed;
  }
  if (active !== undefined) {
    data.active = Boolean(active);
    // Al desactivar se guarda deactivatedAt: lo usa la regla
    // "jugadoraInactivaSinDeudaFutura" para no sumarle eventos futuros.
    data.deactivatedAt = data.active ? null : new Date();
  }

  const jugadora = await db.player.update({ where: { id: req.params.id }, data });
  res.json(jugadora);
});
