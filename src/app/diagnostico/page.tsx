// Página de diagnóstico: diz por que o site não está funcionando.
//
// Existe porque um erro de servidor no Next em produção chega ao navegador
// como "Application error" e um número de digest, sem nenhuma pista. Esta
// página não depende do banco para renderizar, então continua acessível
// justamente quando todo o resto falhou.
//
// Nada aqui expõe segredo: senhas são omitidas e das variáveis só se mostra
// se existem e o formato.

import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Há alguém logado? Nunca lança: se a verificação em si falhar — porque o
 * banco está fora ou a chave de sessão não existe — a resposta é "não sei",
 * tratada como "não".
 */
async function estaLogado(): Promise<boolean> {
  try {
    return (await getCurrentMember()) !== null;
  } catch {
    return false;
  }
}

type Verificacao = {
  nome: string;
  ok: boolean;
  detalhe: string;
};

/**
 * Confere o formato e resume o endereço, jogando fora usuário e senha.
 *
 * O erro mais comum aqui é colar o "Copy snippet" do Neon, que não é o
 * endereço e sim um comando de terminal: psql 'postgresql://…'. Vale
 * apontar isso pelo nome, porque a diferença não é óbvia olhando.
 */
function conferirEndereco(url: string): { ok: boolean; detalhe: string } {
  if (/^\s*psql\s/i.test(url)) {
    return {
      ok: false,
      detalhe:
        "veio o comando do terminal (psql '…'), não o endereço. " +
        "Guarde só a parte entre aspas, que começa com postgresql://",
    };
  }

  if (!/^postgresql:\/\/|^postgres:\/\//i.test(url.trim())) {
    return { ok: false, detalhe: "formato irreconhecível — deveria começar com postgresql://" };
  }

  try {
    const u = new URL(url.trim());
    return { ok: true, detalhe: `definida → ${u.hostname}${u.pathname}` };
  } catch {
    return { ok: false, detalhe: "endereço malformado — confira se veio inteiro, sem espaços" };
  }
}

async function verificar(): Promise<Verificacao[]> {
  const checagens: Verificacao[] = [];

  const urlBanco = process.env.DATABASE_URL;
  const endereco = urlBanco ? conferirEndereco(urlBanco) : null;
  checagens.push({
    nome: "DATABASE_URL",
    ok: endereco?.ok ?? false,
    detalhe: endereco?.detalhe ?? "NÃO DEFINIDA — cadastre em Settings → Environment Variables",
  });

  const segredo = process.env.SESSION_SECRET;
  checagens.push({
    nome: "SESSION_SECRET",
    ok: Boolean(segredo),
    detalhe: segredo
      ? `definida (${segredo.length} caracteres)`
      : "NÃO DEFINIDA — cadastre em Settings → Environment Variables",
  });

  if (!urlBanco) {
    checagens.push({
      nome: "Conexão com o banco",
      ok: false,
      detalhe: "não testada, porque DATABASE_URL não existe",
    });
    return checagens;
  }

  const cliente = new PrismaClient();
  try {
    await cliente.$queryRaw`SELECT 1`;
    checagens.push({ nome: "Conexão com o banco", ok: true, detalhe: "respondeu" });

    const linhas = await cliente.$queryRaw<{ existe: boolean }[]>`
      SELECT to_regclass('public."Member"') IS NOT NULL AS existe
    `;
    const temTabelas = linhas[0]?.existe === true;

    checagens.push({
      nome: "Tabelas criadas",
      ok: temTabelas,
      detalhe: temTabelas ? "sim" : "ainda não — serão criadas na primeira visita ao site",
    });

    if (temTabelas) {
      const total = await cliente.member.count();
      checagens.push({
        nome: "Equipe cadastrada",
        ok: total > 0,
        detalhe: total > 0 ? `${total} integrantes` : "nenhum integrante ainda",
      });
    }
  } catch (erro) {
    const e = erro as { code?: string; message?: string };
    checagens.push({
      nome: "Conexão com o banco",
      ok: false,
      detalhe: `${e.code ?? "erro"} — ${(e.message ?? String(erro)).split("\n")[0].slice(0, 200)}`,
    });
  } finally {
    await cliente.$disconnect();
  }

  return checagens;
}

export default async function Diagnostico() {
  const checagens = await verificar();
  const tudoOk = checagens.every((c) => c.ok);

  // Com tudo funcionando, esta página é só para a equipe: ela mostra o
  // endereço do banco e não precisa ficar aberta na internet.
  //
  // Quando algo está quebrado, ela abre para qualquer um — de propósito. É
  // aí que ela serve, e exigir login não faria sentido: sem banco não há
  // como validar sessão, e quem está publicando ficaria sem diagnóstico
  // justamente na hora do problema. Nesse estado não há dados a proteger,
  // porque o sistema não está de pé.
  if (tudoOk && !(await estaLogado())) redirect("/entrar");

  return (
    <main style={{ fontFamily: "ui-monospace, monospace", padding: "2rem", lineHeight: 1.7 }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Diagnóstico do sistema</h1>

      <p style={{ marginBottom: "1.5rem", fontWeight: 700 }}>
        {tudoOk ? "✓ Tudo certo — o site deve estar funcionando." : "✗ Achei o problema (abaixo)."}
      </p>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {checagens.map((c) => (
          <li key={c.nome} style={{ marginBottom: "0.75rem" }}>
            <strong>
              {c.ok ? "✓" : "✗"} {c.nome}
            </strong>
            <br />
            <span style={{ opacity: 0.8, wordBreak: "break-word" }}>{c.detalhe}</span>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "2rem", opacity: 0.7, fontSize: "0.875rem" }}>
        Esta página não mostra senhas. Depois que o sistema estiver no ar, ela pode ser apagada.
      </p>
    </main>
  );
}
