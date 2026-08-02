// Troca o projeto de SQLite para PostgreSQL.
//
// Use quando for hospedar num lugar sem disco persistente — Vercel, por
// exemplo — junto com um Postgres gerenciado (Neon, Supabase, Railway).
//
//   node scripts/usar-postgres.mjs
//
// O que muda: o `provider` do schema e o comando de build (que passa a
// sincronizar o banco com `prisma db push` em vez de aplicar as migrações
// de SQLite, que são incompatíveis). Nenhuma linha do app muda.
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";

const SCHEMA = "prisma/schema.prisma";
const PKG = "package.json";

const schema = readFileSync(SCHEMA, "utf8");

if (schema.includes('provider = "postgresql"')) {
  console.log("O projeto já está configurado para PostgreSQL. Nada a fazer.");
  process.exit(0);
}

if (!schema.includes('provider = "sqlite"')) {
  console.error("Não encontrei o provider 'sqlite' em prisma/schema.prisma.");
  process.exit(1);
}

writeFileSync(SCHEMA, schema.replace('provider = "sqlite"', 'provider = "postgresql"'));
console.log("✓ prisma/schema.prisma agora usa postgresql");

// As migrações existentes têm SQL específico de SQLite e não servem no
// Postgres. O `db push` recria o schema direto a partir do modelo.
if (existsSync("prisma/migrations")) {
  rmSync("prisma/migrations", { recursive: true, force: true });
  console.log("✓ migrações de SQLite removidas (o Postgres usa `db push`)");
}

const pkg = JSON.parse(readFileSync(PKG, "utf8"));
pkg.scripts.build = "prisma generate && prisma db push && node scripts/seed-if-empty.mjs && next build";
pkg.scripts.setup = "prisma db push && npm run db:seed";
writeFileSync(PKG, JSON.stringify(pkg, null, 2) + "\n");
console.log("✓ scripts de build e setup ajustados");

console.log(`
Pronto. Próximos passos:

  1. Crie um banco Postgres grátis em neon.com (ou supabase.com).
  2. Copie a "connection string" que eles mostram.
  3. Coloque em DATABASE_URL — no .env para testar aqui, e nas variáveis
     de ambiente do host para publicar.
  4. git add -A && git commit -m "Muda para PostgreSQL" && git push

O deploy vai criar as tabelas e cadastrar a equipe sozinho no primeiro build.
`);
