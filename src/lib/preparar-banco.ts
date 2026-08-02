// Deixa o banco pronto na primeira vez que alguém abre o site.
//
// Antes isso acontecia durante o build, o que tornava a publicação
// dependente de o servidor de build conseguir falar com o banco — se a rede
// falhasse, o deploy inteiro morria. Aqui o build não toca no banco: ele só
// compila. O preparo acontece na primeira consulta real.
//
// A hospedagem sobe várias instâncias em paralelo, e cada uma tem a sua
// própria memória: a promessa abaixo evita trabalho repetido dentro de um
// processo, mas não coordena nada entre processos. Quem faz isso é uma trava
// no próprio Postgres — sem ela, duas instâncias criam as mesmas tabelas ao
// mesmo tempo e a segunda quebra com "relation already exists".

import { PrismaClient, type Prisma } from "@prisma/client";
import { SCHEMA_SQL } from "./schema-gerado";
import { semear } from "./dados-iniciais";
import { comRetentativa } from "./retentativa";

// Número arbitrário, só precisa ser o mesmo em todas as instâncias: é o nome
// da trava. Qualquer outro sistema no mesmo banco usaria um número diferente.
const TRAVA_PREPARO = 8274123456789n;

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
    // A primeira consulta da instância é justamente a que encontra o banco
    // hibernando, então esta é a que mais precisa aguentar a espera.
    await comRetentativa(() =>
      cliente.$transaction(
        async (tx) => {
          // Só uma instância passa daqui por vez; as outras ficam esperando e,
          // quando entram, já encontram tudo pronto e não fazem nada. A trava
          // é liberada sozinha no fim da transação, inclusive se algo falhar.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TRAVA_PREPARO})`;

          if (!(await temTabelas(tx))) {
            console.log("[preparar-banco] Banco vazio — criando as tabelas…");
            await aplicarSchema(tx);
            console.log("[preparar-banco] Tabelas criadas.");
          }

          if ((await tx.member.count()) === 0) {
            console.log("[preparar-banco] Cadastrando a equipe inicial…");
            const { integrantes, modelos } = await semear(tx);
            console.log(`[preparar-banco] ${integrantes} integrantes, ${modelos} modelos.`);
          }
        },
        // O padrão do Prisma é 5s, curto demais para criar 12 tabelas num banco
        // que talvez esteja acordando do repouso — e para quem espera a trava.
        { timeout: 60_000, maxWait: 60_000 },
      ),
    );
  } finally {
    await cliente.$disconnect();
  }
}

async function temTabelas(tx: Prisma.TransactionClient): Promise<boolean> {
  const linhas = await tx.$queryRaw<{ existe: boolean }[]>`
    SELECT to_regclass('public."Member"') IS NOT NULL AS existe
  `;
  return linhas[0]?.existe === true;
}

async function aplicarSchema(tx: Prisma.TransactionClient): Promise<void> {
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
    await tx.$executeRawUnsafe(comando);
  }

  // Confere de verdade, em vez de confiar que os comandos funcionaram.
  if (!(await temTabelas(tx))) {
    throw new Error("As tabelas não apareceram depois de aplicar o schema.");
  }
}
