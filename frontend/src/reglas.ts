// Reglas de la UI que antes vivían adentro de los componentes.
// Son funciones puras: se testean sin DOM ni React (TP5, §3.0 "mínimo 4 tests sin DOM").
// El backend vuelve a validar todo: acá son reglas de UX, no de seguridad.
import type { ParticipanteVM } from "./api";

/** Nombre obligatorio: alta de jugadora y renombrar. */
export function nombreValido(nombre: string): boolean {
  return nombre.trim().length > 0;
}

/** EventoForm: no se puede enviar sin nombre, sin fecha o con un monto que no sea > 0. */
export function puedeCrearEvento(name: string, amount: string, dueDate: string): boolean {
  return nombreValido(name) && Number(amount) > 0 && dueDate !== "";
}

/**
 * EventoCard: "X pagaron / Y faltan". Las exentas no cuentan.
 * `pagos` es el estado local (optimista) de cada participación.
 */
export function contarPagos(participantes: ParticipanteVM[], pagos: Record<string, boolean>) {
  const relevantes = participantes.filter((p) => !p.exempt);
  const pagaron = relevantes.filter((p) => pagos[p.eventParticipantId]).length;
  return { pagaron, faltan: relevantes.length - pagaron };
}

/** Texto para el ErrorBanner a partir de lo que se haya lanzado (Error o cualquier otra cosa). */
export function mensajeDeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
