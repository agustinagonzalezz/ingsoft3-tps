import { useState } from "react";
import { api } from "../api";
import { useApi } from "../useApi";
import { JugadoraRow } from "../components/JugadoraRow";
import { ErrorBanner } from "../components/ErrorBanner";

export function JugadorasPage() {
  const { data: jugadoras, error, recargar } = useApi(api.getJugadoras);
  const [nombre, setNombre] = useState("");
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  // Envuelve cada escritura: si la API responde error, se muestra; si no, se recarga la lista.
  const ejecutar = async (accion: () => Promise<unknown>) => {
    try {
      await accion();
      setErrorAccion(null);
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : String(e));
    }
    await recargar();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Jugadoras</h1>
        <p className="text-sm text-zinc-600">Alta, edición de nombre y estado activo/inactivo.</p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await ejecutar(() => api.crearJugadora(nombre));
          setNombre("");
        }}
      >
        <input
          name="name"
          placeholder="Nombre de la jugadora"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full max-w-xs rounded border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={nombre.trim().length === 0}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agregar
        </button>
      </form>

      <ErrorBanner message={error ?? errorAccion} />

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-left text-zinc-500">
            <th className="py-2 pr-4 font-medium">Nombre</th>
            <th className="py-2 pr-4 font-medium">Estado</th>
            <th className="py-2 pr-4 text-right font-medium">Deuda</th>
            <th className="py-2 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jugadoras?.map((jugadora) => (
            <JugadoraRow
              key={jugadora.id}
              {...jugadora}
              onRenombrar={(name) => ejecutar(() => api.editarJugadora(jugadora.id, { name }))}
              onToggleActiva={() => ejecutar(() => api.editarJugadora(jugadora.id, { active: !jugadora.active }))}
            />
          ))}
          {jugadoras?.length === 0 && (
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
