import { useState } from "react";
import type { EventType, NuevoEvento } from "../api";
import { puedeCrearEvento } from "../reglas";

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

  // La regla vive en reglas.ts (testeada); el backend vuelve a validar.
  const disabled = !puedeCrearEvento(name, amount, dueDate);

  return (
    // TP7: cada control lleva su aria-label (el nombre que lee un lector de pantalla). Con
    // el placeholder solo, el campo no tiene nombre accesible, y las e2e lo buscan por ahí.
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
        aria-label="Nombre del evento"
        placeholder="Nombre del evento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm sm:col-span-2"
      />
      <select
        name="type"
        aria-label="Tipo de evento"
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
        aria-label="Monto"
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
        aria-label="Fecha de vencimiento"
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
        Agregar evento
      </button>
    </form>
  );
}
