// Mudanças de estrutura aplicadas a um banco que já existe.
//
// O preparo automático cria as tabelas quando o banco está vazio, mas não
// mexe num banco que já tem dados. Quando o schema ganha uma coluna nova, é
// aqui que ela é acrescentada — sem apagar nada.
//
// Toda instrução precisa ser idempotente: roda a cada partida do sistema e
// não pode dar erro se a mudança já tiver sido aplicada. Em Postgres,
// "IF NOT EXISTS" resolve isso na maioria dos casos.
//
// Só acrescente ao fim da lista; não reescreva o que já foi aplicado.

export const MIGRACOES: { nome: string; sql: string }[] = [
  {
    nome: "Member.isTreasurer",
    sql: `ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "isTreasurer" BOOLEAN NOT NULL DEFAULT false`,
  },
];
