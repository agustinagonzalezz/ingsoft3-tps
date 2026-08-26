// Singleton de PrismaClient — Prisma 7 usa un driver adapter en runtime,
// no una URL directa en schema.prisma. En dev, Next.js recarga módulos con
// HMR: guardamos la instancia en globalThis para no abrir un pool nuevo en
// cada reload.
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida. Revisá el archivo .env");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
