import { useState } from "react";
import type { EventType, NuevoEvento } from "../api";

const TIPOS: { value: EventType; label: string }[] = [
  { value: "CUOTA", label: "Cuota" },
  { value: "TORNEO", label: "Torneo" },
  { value: "AMISTOSO", label: "Amistoso" },
  { value: "OTRO", label: "Otro" },
];

type Props = { onCrear: (evento: NuevoEvento) => Promise<void> };

export function EventoForm({ onCrear }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<EventType>("CUOTA");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Regla de frontend: no se puede enviar si falta el nombre o el monto no es > 0.
  // (El backend vuelve a validar: esto es UX, no seguridad.)
  const montoValido = Number(amount) > 0;
  const disabled = name.trim().length === 0 || !montoValido || !dueDate;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onCrear({ name: name.trim(), type, amount: Number(amount), dueDate });
        setName("");
        setAmount("");
        setDueDate("");
      }}
      className="grid grid-cols-1 gap-2 rounded border border-zinc-200 bg-white p-4 sm:grid-cols-5"
    >
      <input
        name="name"
        placeholder="Nombre del evento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm sm:col-span-2"
      />
      <select
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as EventType)}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
      >
        {TIPOS.map((tipo) => (
          <option key={tipo.value} value={tipo.value}>
            {tipo.label}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        step="0.01"
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
      />
      <input
        name="dueDate"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-5"
      >
        Crear evento
      </button>
    </form>
  );
}
