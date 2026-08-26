import { db } from "@/lib/db";
import { calcularBalanceEquipo, calcularDeudaJugadora, jugadoraInactivaSinDeudaFutura } from "@/lib/rules";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [jugadoras, eventos, pagos, gastos] = await Promise.all([
    db.player.findMany(),
    db.event.findMany({ include: { participants: true } }),
    db.payment.findMany(),
    db.expense.findMany(),
  ]);

  const eventosNumericos = eventos.map((e) => ({
    ...e,
    amount: e.amount.toNumber(),
    participants: e.participants.map((p) => ({
      ...p,
      amountOverride: p.amountOverride?.toNumber() ?? null,
    })),
  }));
  const pagosNumericos = pagos.map((p) => ({ ...p, amount: p.amount.toNumber() }));
  const gastosNumericos = gastos.map((g) => ({ ...g, amount: g.amount.toNumber() }));

  const { recaudado, gastos: gastado, balance } = calcularBalanceEquipo(
    eventosNumericos,
    pagosNumericos,
    gastosNumericos
  );

  const pendiente = jugadoras.reduce((acc, jugadora) => {
    const eventosAplicables = jugadoraInactivaSinDeudaFutura(jugadora, eventosNumericos);
    return acc + calcularDeudaJugadora(jugadora, eventosAplicables, pagosNumericos);
  }, 0);

  const tarjetas = [
    { label: "Recaudado", value: recaudado },
    { label: "Pendiente de cobro", value: pendiente },
    { label: "Gastos", value: gastado },
    { label: "Balance neto", value: balance },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-600">Balance general del equipo.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div key={tarjeta.label} className="rounded border border-zinc-200 bg-white p-4">
            <p className="text-xs text-zinc-500">{tarjeta.label}</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(tarjeta.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
