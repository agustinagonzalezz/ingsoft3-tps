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

// El "contrato" del cliente HTTP: misma forma que fetch.
// En la app entra el fetch real; en los tests, un vi.fn().
export type Traer = (url: string, init?: RequestInit) => Promise<Response>;

export async function request<T>(traer: Traer, path: string, init?: RequestInit): Promise<T> {
  const res = await traer(`/api${path}`, {
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

// Las rutas de cada endpoint. El cliente HTTP entra por parámetro (igual que en
// `request`): en la app es el fetch real; en los tests, un vi.fn() que registra
// qué URL y qué método se pidieron.
export function crearApi(traer: Traer) {
  const llamar = <T>(path: string, init?: RequestInit) => request<T>(traer, path, init);

  return {
    getDashboard: () => llamar<Dashboard>("/dashboard"),

    getJugadoras: () => llamar<Jugadora[]>("/jugadoras"),
    crearJugadora: (name: string) => llamar("/jugadoras", json("POST", { name })),
    editarJugadora: (id: string, cambios: { name?: string; active?: boolean }) =>
      llamar(`/jugadoras/${id}`, json("PATCH", cambios)),

    getEventos: () => llamar<EventoVM[]>("/eventos"),
    crearEvento: (evento: NuevoEvento) => llamar("/eventos", json("POST", evento)),
    eliminarEvento: (id: string) => llamar(`/eventos/${id}`, json("DELETE")),
    eximir: (eventId: string, playerId: string) => llamar(`/eventos/${eventId}/eximir/${playerId}`, json("POST")),

    marcarPago: (participacionId: string) => llamar(`/participaciones/${participacionId}/pago`, json("PUT")),
    desmarcarPago: (participacionId: string) => llamar(`/participaciones/${participacionId}/pago`, json("DELETE")),
  };
}

// El cliente REAL, en un solo lugar (el equivalente del registro en Program.cs).
// Arrow function y no `fetch` suelto: si fetch se llama como método de otro
// objeto, el navegador tira "Illegal invocation".
const traerReal: Traer = (url, init) => fetch(url, init);
export const api = crearApi(traerReal);
