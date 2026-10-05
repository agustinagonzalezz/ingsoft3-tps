// Prisma 7 — configuración del CLI (migraciones, seed, datasource).
// El PrismaClient de runtime se configura en src/lib/db.ts con el adapter PrismaPg.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
