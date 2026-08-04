// Peças visuais do relatório.
//
// O relatório é lido projetado numa parede, e não só no celular: por isso os
// números vêm grandes, cada gráfico traz o valor escrito ao lado da barra, e
// nada depende só de cor para ser entendido.

import type { ReactNode } from "react";

/** Número em destaque, com uma linha explicando o que ele significa. */
export function Numerao({
  valor,
  rotulo,
  nota,
  tom = "neutro",
}: {
  valor: string;
  rotulo: string;
  nota?: string;
  tom?: "neutro" | "positivo" | "negativo";
}) {
  const corDoValor =
    tom === "positivo" ? "texto-positivo" : tom === "negativo" ? "texto-negativo" : "text-slate-100";

  return (
    <div className="card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{rotulo}</p>
      <p className={`mt-1 break-words text-2xl font-bold tabular-nums leading-tight sm:text-3xl ${corDoValor}`}>
        {valor}
      </p>
      {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

/** Título de seção do relatório, com a explicação do que ali se mede. */
export function Secao({
  numero,
  titulo,
  resumo,
  children,
}: {
  numero: number;
  titulo: string;
  resumo: string;
  children: ReactNode;
}) {
  return (
    <section className="quebra-antes mb-8">
      <header className="mb-3 border-b border-ink-700 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold tabular-nums text-brand-500">
            {String(numero).padStart(2, "0")}
          </span>
          <h2 className="text-lg font-bold text-slate-100">{titulo}</h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">{resumo}</p>
      </header>
      {children}
    </section>
  );
}

/**
 * Barras horizontais comparando itens de uma mesma medida.
 *
 * O valor aparece escrito ao lado de cada barra, então a leitura não depende
 * de comparar comprimentos nem de enxergar cor — o que importa quando isso
 * está projetado longe de quem lê.
 */
export function Barras({
  itens,
  formatar = (n) => String(n),
  tom = "brand",
  vazio = "Nada registrado neste período.",
}: {
  itens: { rotulo: string; valor: number; nota?: string }[];
  formatar?: (n: number) => string;
  tom?: "brand" | "verde" | "vermelho";
  vazio?: string;
}) {
  if (itens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
        {vazio}
      </p>
    );
  }

  const maior = Math.max(...itens.map((i) => i.valor), 1);
  const fundo =
    tom === "verde" ? "bg-emerald-500" : tom === "vermelho" ? "bg-red-500" : "bg-brand-500";

  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium text-slate-200">{i.rotulo}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-100">
              {formatar(i.valor)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
            <div
              className={`h-full rounded-full ${fundo}`}
              style={{ width: `${Math.max((i.valor / maior) * 100, i.valor > 0 ? 2 : 0)}%` }}
            />
          </div>
          {i.nota && <p className="mt-0.5 text-[11px] text-slate-500">{i.nota}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Proporção de algo concluído, com o número por extenso ao lado. */
export function Medidor({
  percentual,
  rotulo,
  detalhe,
}: {
  percentual: number;
  rotulo: string;
  detalhe: string;
}) {
  const pct = Math.max(0, Math.min(100, percentual));
  const tom = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="card">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {rotulo}
      </p>
      <p className="mb-2 mt-1 text-3xl font-bold tabular-nums leading-tight text-slate-100">
        {pct.toFixed(0)}%
      </p>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
        <div className={`h-full rounded-full ${tom}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detalhe}</p>
    </div>
  );
}

/** Tabela simples, para quando a lista importa mais que a comparação. */
export function Tabela({
  colunas,
  linhas,
}: {
  colunas: string[];
  linhas: (string | number)[][];
}) {
  if (linhas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
        Nada registrado neste período.
      </p>
    );
  }

  return (
    <div className="no-scrollbar overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-500">
            {colunas.map((c, i) => (
              <th key={c} className={`py-2 pr-3 font-semibold ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, n) => (
            <tr key={n} className="border-t border-ink-700">
              {linha.map((celula, i) => (
                <td
                  key={i}
                  className={`py-2 pr-3 ${i > 0 ? "text-right tabular-nums text-slate-300" : "font-medium text-slate-200"}`}
                >
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
