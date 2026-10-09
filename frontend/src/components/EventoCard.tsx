import { useState, useTransition } from "react";
import type { EventoVM, ParticipanteVM } from "../api";
import { formatCurrency, formatDate } from "../format";
import { contarPagos } from "../reglas";

type Props = {
  evento: EventoVM;
  onMarcarPago: (eventParticipantId: string) => Promise<void>;
  onDesmarcarPago: (eventParticipantId: string) => Promise<void>;
  onEximir: (playerId: string) => Promise<void>;
  onEliminar: () => Promise<void>;
};

export function EventoCard({ evento, onMarcarPago, onDesmarcarPago, onEximir, onEliminar }: Props) {
  const { name, type, amount, dueDate, puedeEliminar, participantes } = evento;

  // Estado local para que "X pagaron / Y faltan" se recalcule al instante,
  // sin esperar la respuesta de la API (actualización optimista).
  const [pagos, setPagos] = useState<Record<string, boolean>>(
    Object.fromEntries(participantes.map((p) => [p.eventParticipantId, p.pagada]))
  );
  const [isPending, startTransition] = useTransition();

  const { pagaron, faltan } = contarPagos(participantes, pagos);

  const togglePago = (participante: ParticipanteVM) => {
    const nuevoEstado = !pagos[participante.eventParticipantId];
    setPagos((prev) => ({ ...prev, [participante.eventParticipantId]: nuevoEstado }));

    startTransition(() =>
      nuevoEstado ? onMarcarPago(participante.eventParticipantId) : onDesmarcarPago(participante.eventParticipantId)
    );
  };

  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-medium">{name}</h2>
          <p className="text-xs text-zinc-500">
            {type} · {formatCurrency(amount)} · vence {formatDate(dueDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">
            {pagaron} pagaron / {faltan} faltan
          </p>
          {puedeEliminar && (
            <button className="text-xs text-red-600" onClick={() => startTransition(onEliminar)} disabled={isPending}>
              Eliminar evento
            </button>
          )}
        </div>
      </div>

      <ul className="mt-3 divide-y divide-zinc-100 text-sm">
        {participantes.map((participante) => (
          <li key={participante.eventParticipantId} className="flex items-center justify-between py-1.5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!pagos[participante.eventParticipantId]}
                disabled={participante.exempt}
                onChange={() => togglePago(participante)}
              />
              <span className={participante.exempt ? "text-zinc-400 line-through" : ""}>
                {participante.playerName}
              </span>
              {participante.exempt && <span className="text-xs text-zinc-400">(exenta)</span>}
            </label>
            {!participante.exempt && (
              <button
                className="text-xs text-zinc-500"
                onClick={() => startTransition(() => onEximir(participante.playerId))}
              >
                Eximir
              </button>
            )}
          </li>
        ))}
        {participantes.length === 0 && (
          <li className="py-1.5 text-zinc-500">No había jugadoras activas al crear este evento.</li>
        )}
      </ul>
    </div>
  );
}
