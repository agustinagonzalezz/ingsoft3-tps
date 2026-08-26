"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function crearJugadora(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await db.player.create({ data: { name } });
  revalidatePath("/jugadoras");
}

export async function editarNombreJugadora(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;

  await db.player.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/jugadoras");
}

export async function toggleActivaJugadora(id: string, active: boolean) {
  await db.player.update({
    where: { id },
    // Al desactivar se guarda deactivatedAt: lo usa la regla
    // "jugadoraInactivaSinDeudaFutura" para no sumarle eventos futuros.
    data: { active, deactivatedAt: active ? null : new Date() },
  });
  revalidatePath("/jugadoras");
}
