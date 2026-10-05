import { Router } from "express";
import { db } from "../db.js";
import { calcularBalanceEquipo, calcularDeudaJugadora, jugadoraInactivaSinDeudaFutura } from "../rules.js";
import { toEvento, toGasto, toPago } from "../mappers.js";

export const dashboardRouter = Router();

// GET /api/dashboard — totales del equipo (reglas 1, 2 y 6).
dashboardRouter.get("/", async (_req, res) => {
  const [jugadoras, eventos, pagos, gastos] = await Promise.all([
    db.player.findMany(),
    db.event.findMany({ include: { participants: true } }),
    db.payment.findMany(),
    db.expense.findMany(),
  ]);
  const eventosNum = eventos.map(toEvento);
  const pagosNum = pagos.map(toPago);

  const { recaudado, gastos: gastado, balance } = calcularBalanceEquipo(eventosNum, pagosNum, gastos.map(toGasto));
  const pendiente = jugadoras.reduce(
    (acc, j) => acc + calcularDeudaJugadora(j, jugadoraInactivaSinDeudaFutura(j, eventosNum), pagosNum),
    0
  );

  res.json({ recaudado, pendiente, gastos: gastado, balance });
});
