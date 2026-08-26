"use client";

import { useState } from "react";
import { crearEvento } from "./actions";

const TIPOS = [
  { value: "CUOTA", label: "Cuota" },
  { value: "TORNEO", label: "Torneo" },
  { value: "AMISTOSO", label: "Amistoso" },
  { value: "OTRO", label: "Otro" },
];

export function EventoForm() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // Regla de frontend: no se puede enviar si falta el nombre o el monto no es > 0.
  const montoValido = Number(amount) > 0;
  const disabled = name.trim().length === 0 || !montoValido;

  return (
    <form
      action={async (formData) => {
        await crearEvento(formData);
        setName("");
        setAmount("");
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
      <select name="type" defaultValue="CUOTA" className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
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
      <input name="dueDate" type="date" required className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
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
