// Único punto de contacto del frontend con el backend.
// Todas las rutas son RELATIVAS (/api/...): quien las lleva al backend es
// el proxy de Vite en dev y nginx en el contenedor. Sin CORS, sin URLs fijas.

export type EventType = "CUOTA" | "TORNEO" | "AMISTOSO" | "OTRO";

export type Jugadora = { id: string; name: string; active: boolean; deuda: number };

export type ParticipanteVM = {
  eventParticipantId: string;
  playerId: string;
  playerName: string;
  montoEsperado: number;
  exempt: boolean;
  pagada: boolean;
};

export type EventoVM = {
  id: string;
  name: string;
  type: EventType;
  amount: number;
  dueDate: string; // ISO: JSON no tiene tipo Date
  puedeEliminar: boolean;
  participantes: ParticipanteVM[];
};

export type Dashboard = { recaudado: number; pendiente: number; gastos: number; balance: number };

export type NuevoEvento = { name: string; type: EventType; amount: number; dueDate: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  getDashboard: () => request<Dashboard>("/dashboard"),

  getJugadoras: () => request<Jugadora[]>("/jugadoras"),
  crearJugadora: (name: string) => request("/jugadoras", json("POST", { name })),
  editarJugadora: (id: string, cambios: { name?: string; active?: boolean }) =>
    request(`/jugadoras/${id}`, json("PATCH", cambios)),

  getEventos: () => request<EventoVM[]>("/eventos"),
  crearEvento: (evento: NuevoEvento) => request("/eventos", json("POST", evento)),
  eliminarEvento: (id: string) => request(`/eventos/${id}`, json("DELETE")),
  eximir: (eventId: string, playerId: string) => request(`/eventos/${eventId}/eximir/${playerId}`, json("POST")),

  marcarPago: (participacionId: string) => request(`/participaciones/${participacionId}/pago`, json("PUT")),
  desmarcarPago: (participacionId: string) => request(`/participaciones/${participacionId}/pago`, json("DELETE")),
};
