// Gera o SQL que cria as tabelas, a partir do prisma/schema.prisma.
//
// Roda durante o build e NÃO precisa de banco nenhum — o Prisma consegue
// calcular "o que seria preciso para sair do zero até este schema" offline.
// O resultado vira um módulo TypeScript para que o Next embuta no bundle;
// se fosse um .sql solto, poderia não ser incluído no deploy.

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const sql = execFileSync(
  "npx",
  [
    "prisma",
    "migrate",
    "diff",
    "--from-empty",
    "--to-schema-datamodel",
    "prisma/schema.prisma",
    "--script",
  ],
  { encoding: "utf8" },
);

const destino = "src/lib/schema-gerado.ts";

writeFileSync(
  destino,
  `// GERADO AUTOMATICAMENTE por scripts/gerar-schema-sql.mjs — não edite à mão.
// Para atualizar: altere prisma/schema.prisma e rode o build.

export const SCHEMA_SQL = ${JSON.stringify(sql)};
`,
);

const tabelas = (sql.match(/CREATE TABLE/g) ?? []).length;
console.log(`  ✓ ${destino} — ${tabelas} tabelas`);
