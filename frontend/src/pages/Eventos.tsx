import { useState } from "react";
import { api } from "../api";
import { useApi } from "../useApi";
import { EventoForm } from "../components/EventoForm";
import { EventoCard } from "../components/EventoCard";
import { ErrorBanner } from "../components/ErrorBanner";

export function EventosPage() {
  const { data: eventos, error, recargar } = useApi(api.getEventos);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

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
        <h1 className="text-xl font-semibold">Eventos</h1>
        <p className="text-sm text-zinc-600">Cuotas, torneos y amistosos del equipo.</p>
      </div>

      <EventoForm onCrear={(evento) => ejecutar(() => api.crearEvento(evento))} />

      <ErrorBanner message={error ?? errorAccion} />

      <div className="space-y-4">
        {eventos?.map((evento) => (
          <EventoCard
            // La key incluye el estado de pagos: si el backend cambia algo,
            // la tarjeta se remonta con los datos frescos.
            key={evento.id + evento.participantes.map((p) => `${p.pagada}${p.exempt}`).join()}
            evento={evento}
            onMarcarPago={(id) => ejecutar(() => api.marcarPago(id))}
            onDesmarcarPago={(id) => ejecutar(() => api.desmarcarPago(id))}
            onEximir={(playerId) => ejecutar(() => api.eximir(evento.id, playerId))}
            onEliminar={() => ejecutar(() => api.eliminarEvento(evento.id))}
          />
        ))}
        {eventos?.length === 0 && <p className="text-sm text-zinc-500">Todavía no hay eventos cargados.</p>}
      </div>
    </div>
  );
}
