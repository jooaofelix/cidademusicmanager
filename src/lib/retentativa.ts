// Repete uma operação quando o banco falha por motivo passageiro.
//
// O banco do plano grátis do Neon hiberna depois de alguns minutos parado.
// A primeira consulta depois disso precisa acordá-lo, e pode estourar o
// tempo limite antes de o banco responder. Sem tratamento, isso vira uma
// página de erro para quem abriu o site — e some ao recarregar, que é o
// pior tipo de falha: intermitente e sem explicação para o usuário.

/** Falhas que valem repetir: o banco está indisponível agora, não com defeito. */
const CODIGOS_PASSAGEIROS = new Set([
  "P1001", // não conseguiu alcançar o servidor
  "P1002", // servidor alcançado, mas expirou o tempo de conexão
  "P1008", // tempo limite da operação
  "P1017", // o servidor fechou a conexão
  "P2024", // esgotou o tempo esperando uma conexão livre do pool
]);

const TENTATIVAS = 4;
const ESPERA_INICIAL_MS = 300;

function ehPassageiro(erro: unknown): boolean {
  const codigo = (erro as { code?: unknown })?.code;
  return typeof codigo === "string" && CODIGOS_PASSAGEIROS.has(codigo);
}

const dormir = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executa `operacao`, repetindo enquanto o erro for de indisponibilidade.
 * Espera cada vez mais entre as tentativas (0,3s, 0,6s, 1,2s), o suficiente
 * para o banco terminar de acordar. Erros de verdade sobem na hora.
 */
export async function comRetentativa<T>(operacao: () => Promise<T>): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await operacao();
    } catch (erro) {
      if (!ehPassageiro(erro) || tentativa >= TENTATIVAS) throw erro;

      const espera = ESPERA_INICIAL_MS * 2 ** (tentativa - 1);
      console.log(
        `[banco] indisponível (${(erro as { code: string }).code}), ` +
          `tentando de novo em ${espera}ms — tentativa ${tentativa} de ${TENTATIVAS - 1}`,
      );
      await dormir(espera);
    }
  }
}
