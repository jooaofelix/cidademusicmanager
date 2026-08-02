import { PrismaClient } from "@prisma/client";
import { prepararBanco } from "./preparar-banco";
import { comRetentativa } from "./retentativa";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = base;

// Toda consulta espera o banco estar pronto e sobrevive a ele estar
// hibernando. Depois da primeira vez, prepararBanco devolve uma promessa já
// resolvida e a retentativa nunca dispara — o custo em uso normal é zero.
export const db = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      await prepararBanco();
      return comRetentativa(() => query(args));
    },
  },
});
