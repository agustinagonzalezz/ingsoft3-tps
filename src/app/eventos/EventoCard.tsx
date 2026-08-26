"use client";

import { useState, useTransition } from "react";
import { desmarcarPago, eliminarEvento, eximirParticipante, marcarPago } from "./actions";
import { formatCurrency, formatDate } from "@/lib/format";

export type ParticipanteVM = {
  eventParticipantId: string;
  playerId: string;
  playerName: string;
  montoEsperado: number;
  exempt: boolean;
  pagada: boolean;
};

type Props = {
  id: string;
  name: string;
  type: string;
  amount: number;
  dueDate: Date;
  puedeEliminar: boolean;
  participantes: ParticipanteVM[];
};

export function EventoCard({ id, name, type, amount, dueDate, puedeEliminar, participantes }: Props) {
  // Estado local para que "X pagaron / Y faltan" se recalcule al instante,
  // sin esperar a que el server action revalide la página.
  const [pagos, setPagos] = useState<Record<string, boolean>>(
    Object.fromEntries(participantes.map((p) => [p.eventParticipantId, p.pagada]))
  );
  const [isPending, startTransition] = useTransition();

  const relevantes = participantes.filter((p) => !p.exempt);
  const pagaron = relevantes.filter((p) => pagos[p.eventParticipantId]).length;
  const faltan = relevantes.length - pagaron;

  const togglePago = (participante: ParticipanteVM) => {
    const nuevoEstado = !pagos[participante.eventParticipantId];
    setPagos((prev) => ({ ...prev, [participante.eventParticipantId]: nuevoEstado }));

    startTransition(async () => {
      if (nuevoEstado) {
        await marcarPago(participante.eventParticipantId, participante.montoEsperado);
      } else {
        await desmarcarPago(participante.eventParticipantId);
      }
    });
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
            <button
              className="text-xs text-red-600"
              onClick={() => startTransition(() => eliminarEvento(id))}
              disabled={isPending}
            >
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
                onClick={() => startTransition(() => eximirParticipante(id, participante.playerId))}
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
