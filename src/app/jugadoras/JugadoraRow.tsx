"use client";

import { useState, useTransition } from "react";
import { editarNombreJugadora, toggleActivaJugadora } from "./actions";
import { formatCurrency } from "@/lib/format";

type Props = {
  id: string;
  name: string;
  active: boolean;
  deuda: number;
};

export function JugadoraRow({ id, name, active, deuda }: Props) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(name);
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-zinc-200 last:border-0">
      <td className="py-2 pr-4">
        {editando ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await editarNombreJugadora(id, nombre);
                setEditando(false);
              });
            }}
          >
            <input
              className="rounded border border-zinc-300 px-2 py-1 text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
            <button type="submit" className="text-sm text-blue-600" disabled={isPending}>
              Guardar
            </button>
            <button
              type="button"
              className="text-sm text-zinc-500"
              onClick={() => {
                setNombre(name);
                setEditando(false);
              }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <button className="text-left hover:underline" onClick={() => setEditando(true)}>
            {name}
          </button>
        )}
      </td>
      <td className="py-2 pr-4">
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            active ? "bg-green-100 text-green-800" : "bg-zinc-200 text-zinc-600"
          }`}
        >
          {active ? "Activa" : "Inactiva"}
        </span>
      </td>
      <td className="py-2 pr-4 text-right">{formatCurrency(deuda)}</td>
      <td className="py-2 text-right">
        <button
          className="text-sm text-blue-600 disabled:opacity-50"
          disabled={isPending}
          onClick={() => startTransition(() => toggleActivaJugadora(id, !active))}
        >
          {active ? "Marcar inactiva" : "Marcar activa"}
        </button>
      </td>
    </tr>
  );
}
