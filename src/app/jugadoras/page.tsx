import { db } from "@/lib/db";
import { calcularDeudaJugadora, jugadoraInactivaSinDeudaFutura } from "@/lib/rules";
import { crearJugadora } from "./actions";
import { JugadoraRow } from "./JugadoraRow";

export const dynamic = "force-dynamic";

export default async function JugadorasPage() {
  const [jugadoras, eventos, pagos] = await Promise.all([
    db.player.findMany({ orderBy: { createdAt: "asc" } }),
    db.event.findMany({ include: { participants: true } }),
    db.payment.findMany(),
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Jugadoras</h1>
        <p className="text-sm text-zinc-600">Alta, edición de nombre y estado activo/inactivo.</p>
      </div>

      <form action={crearJugadora} className="flex gap-2">
        <input
          name="name"
          placeholder="Nombre de la jugadora"
          required
          className="w-full max-w-xs rounded border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white">
          Agregar
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Nombre</th>
            <th className="py-2 pr-4 font-medium">Estado</th>
            <th className="py-2 pr-4 font-medium text-right">Deuda</th>
            <th className="py-2 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jugadoras.map((jugadora) => {
            const eventosAplicables = jugadoraInactivaSinDeudaFutura(jugadora, eventosNumericos);
            const deuda = calcularDeudaJugadora(jugadora, eventosAplicables, pagosNumericos);

            return (
              <JugadoraRow
                key={jugadora.id}
                id={jugadora.id}
                name={jugadora.name}
                active={jugadora.active}
                deuda={deuda}
              />
            );
          })}
          {jugadoras.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-zinc-500">
                Todavía no hay jugadoras cargadas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
