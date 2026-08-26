import { db } from "@/lib/db";
import { puedeEliminarEvento } from "@/lib/rules";
import { EventoForm } from "./EventoForm";
import { EventoCard, type ParticipanteVM } from "./EventoCard";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const eventos = await db.event.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      participants: {
        include: { player: true, payments: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Eventos</h1>
        <p className="text-sm text-zinc-600">Cuotas, torneos y amistosos del equipo.</p>
      </div>

      <EventoForm />

      <div className="space-y-4">
        {eventos.map((evento) => {
          const amount = evento.amount.toNumber();
          const participantesNumericos = evento.participants.map((p) => ({
            ...p,
            amountOverride: p.amountOverride?.toNumber() ?? null,
          }));
          const pagosNumericos = evento.participants.flatMap((p) =>
            p.payments.map((pago) => ({ ...pago, amount: pago.amount.toNumber() }))
          );

          const puedeEliminar = puedeEliminarEvento(
            { ...evento, amount, participants: participantesNumericos },
            pagosNumericos
          );

          const participantes: ParticipanteVM[] = evento.participants.map((p) => ({
            eventParticipantId: p.id,
            playerId: p.playerId,
            playerName: p.player.name,
            montoEsperado: p.amountOverride?.toNumber() ?? amount,
            exempt: p.exempt,
            pagada: p.payments.length > 0,
          }));

          return (
            <EventoCard
              key={evento.id}
              id={evento.id}
              name={evento.name}
              type={evento.type}
              amount={amount}
              dueDate={evento.dueDate}
              puedeEliminar={puedeEliminar}
              participantes={participantes}
            />
          );
        })}
        {eventos.length === 0 && <p className="text-sm text-zinc-500">Todavía no hay eventos cargados.</p>}
      </div>
    </div>
  );
}
