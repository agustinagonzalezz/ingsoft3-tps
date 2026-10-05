import { api } from "../api";
import { useApi } from "../useApi";
import { formatCurrency } from "../format";
import { ErrorBanner } from "../components/ErrorBanner";

export function DashboardPage() {
  // Los totales los calcula el backend (reglas 1, 2 y 6): el front solo muestra.
  const { data, error } = useApi(api.getDashboard);

  const tarjetas = data
    ? [
        { label: "Recaudado", value: data.recaudado },
        { label: "Pendiente de cobro", value: data.pendiente },
        { label: "Gastos", value: data.gastos },
        { label: "Balance neto", value: data.balance },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-zinc-600">Balance general del equipo.</p>
      </div>

      <ErrorBanner message={error} />
      {!data && !error && <p className="text-sm text-zinc-500">Cargando…</p>}

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
