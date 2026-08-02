// Deixa o banco pronto na primeira vez que alguém abre o site.
//
// Antes isso acontecia durante o build, o que tornava a publicação
// dependente de o servidor de build conseguir falar com o banco — se a rede
// falhasse, o deploy inteiro morria. Aqui o build não toca no banco: ele só
// compila. O preparo acontece na primeira consulta real.
//
// Roda uma vez por processo e é seguro em paralelo: várias visitas
// simultâneas compartilham a mesma promessa, e o SQL usa IF NOT EXISTS.

import { PrismaClient } from "@prisma/client";
import { SCHEMA_SQL } from "./schema-gerado";
import { semear } from "./dados-iniciais";

let emAndamento: Promise<void> | null = null;

/** Garante tabelas criadas e dados iniciais. Só age na primeira chamada. */
export function prepararBanco(): Promise<void> {
  emAndamento ??= executar().catch((erro) => {
    // Não memoriza a falha: se o banco estava fora do ar, a próxima visita
    // tenta de novo em vez de deixar o site quebrado para sempre.
    emAndamento = null;
    throw erro;
  });
  return emAndamento;
}

async function executar(): Promise<void> {
  // Cliente próprio, sem a extensão que chama esta função — senão a
  // preparação dispararia a si mesma sem parar.
  const cliente = new PrismaClient();

  try {
    if (!(await temTabelas(cliente))) {
      console.log("[preparar-banco] Banco vazio — criando as tabelas…");
      await aplicarSchema(cliente);
      console.log("[preparar-banco] Tabelas criadas.");
    }

    if ((await cliente.member.count()) === 0) {
      console.log("[preparar-banco] Cadastrando a equipe inicial…");
      const { integrantes, modelos } = await semear(cliente);
      console.log(`[preparar-banco] ${integrantes} integrantes, ${modelos} modelos.`);
    }
  } finally {
    await cliente.$disconnect();
  }
}

async function temTabelas(cliente: PrismaClient): Promise<boolean> {
  const linhas = await cliente.$queryRaw<{ existe: boolean }[]>`
    SELECT to_regclass('public."Member"') IS NOT NULL AS existe
  `;
  return linhas[0]?.existe === true;
}

async function aplicarSchema(cliente: PrismaClient): Promise<void> {
  // O SQL gerado vem como um script com vários comandos. O Prisma não aceita
  // múltiplos comandos numa execução só, então separamos no ponto-e-vírgula
  // que termina uma linha — os comandos gerados nunca têm ; no meio.
  //
  // Cada trecho vem precedido de um comentário ("-- CreateTable"), que
  // precisa ser removido linha a linha: descartar o trecho inteiro por
  // começar com "--" jogaria fora o comando junto.
  const comandos = SCHEMA_SQL.split(/;\s*$/m)
    .map((trecho) =>
      trecho
        .split("\n")
        .filter((linha) => !linha.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((comando) => comando.length > 0);

  if (comandos.length === 0) {
    throw new Error("O SQL de criação das tabelas veio vazio — build incompleto.");
  }

  for (const comando of comandos) {
    await cliente.$executeRawUnsafe(comando);
  }

  // Confere de verdade, em vez de confiar que os comandos funcionaram.
  if (!(await temTabelas(cliente))) {
    throw new Error("As tabelas não apareceram depois de aplicar o schema.");
  }
}
