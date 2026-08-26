import { db } from "@/lib/db";
import { EventType, ExpenseCategory } from "@/generated/prisma/enums";

async function main() {
  console.log("Limpiando datos existentes...");
  await db.payment.deleteMany();
  await db.eventParticipant.deleteMany();
  await db.event.deleteMany();
  await db.expense.deleteMany();
  await db.player.deleteMany();

  console.log("Creando jugadoras...");
  const [maria, sol, cami, vale, agus] = await Promise.all([
    db.player.create({ data: { name: "María López" } }),
    db.player.create({ data: { name: "Sol Fernández" } }),
    db.player.create({ data: { name: "Camila Torres" } }),
    db.player.create({ data: { name: "Valentina Ruiz" } }),
    db.player.create({ data: { name: "Agustina Paz" } }),
  ]);

  // Agustina se dio de baja hace una semana: sirve para ver en la práctica
  // la regla "jugadoraInactivaSinDeudaFutura".
  const deactivatedAt = new Date();
  deactivatedAt.setDate(deactivatedAt.getDate() - 7);
  await db.player.update({
    where: { id: agus.id },
    data: { active: false, deactivatedAt },
  });

  console.log("Creando eventos...");
  const haceUnMes = new Date();
  haceUnMes.setMonth(haceUnMes.getMonth() - 1);

  const cuota = await db.event.create({
    data: {
      name: "Cuota mensual",
      type: EventType.CUOTA,
      amount: 8000,
      dueDate: new Date(new Date().setDate(10)),
      createdAt: haceUnMes,
      participants: {
        create: [maria, sol, cami, vale, agus].map((jugadora) => ({ playerId: jugadora.id })),
      },
    },
    include: { participants: true },
  });

  // Pagos parciales: María pagó completo, Sol pagó la mitad; el resto no pagó.
  const participanteMaria = cuota.participants.find((p) => p.playerId === maria.id)!;
  const participanteSol = cuota.participants.find((p) => p.playerId === sol.id)!;

  await db.payment.create({ data: { eventParticipantId: participanteMaria.id, amount: 8000 } });
  await db.payment.create({ data: { eventParticipantId: participanteSol.id, amount: 4000 } });

  const enUnMes = new Date();
  enUnMes.setMonth(enUnMes.getMonth() + 1);

  await db.event.create({
    data: {
      name: "Torneo Apertura",
      type: EventType.TORNEO,
      amount: 15000,
      dueDate: enUnMes,
      // Agustina ya estaba inactiva cuando se creó este evento: no participa.
      participants: {
        create: [maria, sol, cami, vale].map((jugadora) => ({ playerId: jugadora.id })),
      },
    },
  });

  console.log("Creando gastos...");
  await db.expense.createMany({
    data: [
      { concept: "Pago entrenador", amount: 20000, category: ExpenseCategory.ENTRENADOR, date: new Date() },
      { concept: "Alquiler de cancha", amount: 12000, category: ExpenseCategory.CANCHA, date: new Date() },
      { concept: "Pelotas nuevas", amount: 9000, category: ExpenseCategory.INDUMENTARIA, date: new Date() },
    ],
  });

  console.log("Seed completo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
