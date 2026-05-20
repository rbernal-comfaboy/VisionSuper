import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prevent multiple instances of PrismaClient in development due to hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL variable de entorno no configurada.");
}

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({
      connectionString,
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
export default prisma;
