// Semeia o banco só quando ele ainda não tem nenhum integrante.
// Roda a cada boot, mas não faz nada depois do primeiro — é seguro reiniciar.
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const db = new PrismaClient();

try {
  const count = await db.member.count();

  if (count > 0) {
    console.log(`  ✓ Banco já tem ${count} integrante(s), nada a semear.`);
  } else {
    console.log("  → Banco vazio, criando a equipe inicial…");
    await db.$disconnect();
    execSync("node prisma/seed.mjs", { stdio: "inherit" });
    process.exit(0);
  }
} catch (err) {
  console.error("  ! Não foi possível verificar o banco:", err.message);
  process.exit(1);
} finally {
  await db.$disconnect();
}
