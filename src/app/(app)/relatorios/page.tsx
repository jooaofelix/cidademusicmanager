// Relatório do ministério de música.
//
// Feito para ser mostrado numa reunião, não só consultado no celular: números
// grandes, uma frase explicando cada seção e um botão que gera PDF pelo
// próprio navegador. A escolha de período e áreas viaja na URL, então o mesmo
// recorte pode ser guardado nos favoritos ou reaberto depois exatamente igual.

import Link from "next/link";
import { requireReporter } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { MonthlyChart } from "@/components/MonthlyChart";
import { Barras, N, Numerao, Secao, Tabela } from "@/components/relatorio";
import { BotaoImprimir } from "./BotaoImprimir";
import { brl, fmtDate, fmtDateLong } from "@/lib/format";
import {
  EVENT_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PLATFORMS,
  labelOf,
} from "@/lib/constants";
import {
  AREAS,
  AREAS_PADRAO,
  PERIODOS,
  type AreaId,
  apurarAgenda,
  apurarEquipe,
  apurarFinancas,
  apurarOrganizacao,
  apurarProjetos,
  apurarRepertorio,
  apurarStreaming,
  ehArea,
  ehPeriodo,
  intervaloDe,
} from "@/lib/relatorio";

export const dynamic = "force-dynamic";

type Busca = { periodo?: string; area?: string | string[] };

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const eu = await requireReporter();
  const { periodo: periodoBruto, area: areaBruta } = await searchParams;

  const periodo = periodoBruto && ehPeriodo(periodoBruto) ? periodoBruto : "90d";
  const { de, ate, rotulo: rotuloPeriodo } = intervaloDe(periodo);

  // Caixas de seleção repetem o mesmo nome na URL: uma marcada vira texto,
  // várias viram lista. Sem nenhuma — que é o primeiro acesso — vale o padrão;
  // já um envio com tudo desmarcado precisa mesmo resultar em nada.
  const escolhidas: AreaId[] =
    areaBruta === undefined
      ? AREAS_PADRAO
      : (Array.isArray(areaBruta) ? areaBruta : [areaBruta]).filter(ehArea);

  const tem = (a: AreaId) => escolhidas.includes(a);

  // Cada área só é consultada se foi pedida — relatório curto não paga pelo
  // custo de um relatório completo.
  // Preparação entra junto de Equipe, e Projetos junto de Dinheiro: são
  // assuntos que ninguém apresenta separados.
  const [agenda, equipe, repertorio, organizacao, financas, projetos, streaming] =
    await Promise.all([
      tem("agenda") ? apurarAgenda(de, ate) : null,
      tem("equipe") ? apurarEquipe(de, ate) : null,
      tem("repertorio") ? apurarRepertorio(de, ate) : null,
      tem("equipe") ? apurarOrganizacao(de, ate) : null,
      tem("financas") ? apurarFinancas(de, ate) : null,
      tem("financas") ? apurarProjetos() : null,
      tem("streaming") ? apurarStreaming(de, ate) : null,
    ]);

  const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

  return (
    <>
      <div className="esconder-na-impressao">
        <PageHeader title="Relatório" subtitle="Monte a apresentação do ministério" />

        <form method="get" className="card mb-5 space-y-4">
          <div>
            <span className="label">Período</span>
            <div className="grid grid-cols-2 gap-2">
              {/* O destaque acompanha o que está marcado agora, não o que o
                  servidor desenhou: sem isso, tocar num período não muda nada
                  na tela até gerar, e parece que o botão não funcionou. */}
              {PERIODOS.map((p) => (
                <label
                  key={p.id}
                  className="btn btn-sm cursor-pointer border border-ink-600 bg-ink-800
                             text-slate-300 has-[:checked]:border-brand-500
                             has-[:checked]:tint-blue"
                >
                  <input
                    type="radio"
                    name="periodo"
                    value={p.id}
                    defaultChecked={periodo === p.id}
                    className="sr-only"
                  />
                  {p.rotulo}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="label">O que entra no relatório</span>
            <ul className="space-y-1.5">
              {AREAS.map((a) => (
                <li key={a.id}>
                  <label
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border
                               border-ink-700 p-2.5 transition has-[:checked]:border-brand-500
                               has-[:checked]:bg-brand-500/5"
                  >
                    <input
                      type="checkbox"
                      name="area"
                      value={a.id}
                      defaultChecked={tem(a.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-200">{a.titulo}</span>
                      <span className="block text-xs text-slate-500">{a.resumo}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn-primary w-full">
            Gerar relatório
          </button>
        </form>

        <div className="mb-5 flex gap-2">
          <BotaoImprimir />
          <Link href="/" className="btn-ghost btn-sm flex-1">
            Voltar ao início
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* O relatório em si — é esta parte que sai na impressão.             */}
      {/* ------------------------------------------------------------------ */}

      <article>
        <header className="mb-6 border-b-2 border-brand-500 pb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            Cidade Music
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-100">
            Relatório do Ministério de Música
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {rotuloPeriodo} · {fmtDate(de)} a {fmtDate(ate)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Emitido por {eu.name} em {fmtDateLong(new Date())}
          </p>
        </header>

        {escolhidas.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-slate-500">
            Escolha ao menos uma área acima e toque em <strong>Gerar relatório</strong>.
          </p>
        )}

        {agenda && (
          <Secao
            titulo="Onde servimos"
            frase={
              <>
                No período a equipe serviu em <N>{agenda.realizados}</N>{" "}
                {plural(agenda.realizados, "ocasião", "ocasiões")}
                {agenda.proximos > 0 && (
                  <>
                    , e há <N>{agenda.proximos}</N>{" "}
                    {plural(agenda.proximos, "compromisso já marcado", "compromissos já marcados")}{" "}
                    pela frente
                  </>
                )}
                .
              </>
            }
          >
            <h3 className="section-title mb-2">Por tipo de compromisso</h3>
            <Barras
              itens={agenda.porTipo.map((t) => ({
                rotulo: labelOf(EVENT_TYPES, t.rotulo),
                valor: t.quantidade,
              }))}
              formatar={(n) => `${n} ${plural(n, "vez", "vezes")}`}
            />

            {agenda.ultimos.length > 0 && (
              <>
                <h3 className="section-title mb-2 mt-5">Os mais recentes</h3>
                <Tabela
                  colunas={["Compromisso", "Data", "Músicas"]}
                  linhas={agenda.ultimos.map((e) => [
                    e.title,
                    fmtDate(e.date),
                    e.musicas > 0 ? e.musicas : "—",
                  ])}
                />
              </>
            )}
          </Secao>
        )}

        {equipe && (
          <Secao
            titulo="Nossa equipe"
            frase={
              <>
                <N>{equipe.integrantesAtivos}</N> integrantes ativos somaram{" "}
                <N>{equipe.participacoes}</N>{" "}
                {plural(equipe.participacoes, "participação", "participações")}
                {equipe.participacoes > 0 && (
                  <>
                    , com <N>{equipe.taxaConfirmacao.toFixed(0)}%</N> de confirmação nas escalas
                  </>
                )}
                {organizacao && organizacao.total > 0 && (
                  <>
                    . Das <N>{organizacao.total}</N> tarefas de preparação,{" "}
                    <N>{organizacao.concluidas}</N> {plural(organizacao.concluidas, "foi concluída", "foram concluídas")}
                  </>
                )}
                .
              </>
            }
          >
            <h3 className="section-title mb-2">Quantas vezes cada um serviu</h3>
            <Barras
              itens={equipe.porIntegrante.map((m) => ({
                rotulo: m.nome,
                valor: m.escalas,
                nota: m.instrumento,
              }))}
              formatar={(n) => `${n} ${plural(n, "vez", "vezes")}`}
            />
          </Secao>
        )}

        {repertorio && (
          <Secao
            titulo="Músicas"
            frase={
              <>
                Foram ministradas <N>{repertorio.distintasNoPeriodo}</N>{" "}
                {plural(repertorio.distintasNoPeriodo, "música diferente", "músicas diferentes")},
                de um repertório de <N>{repertorio.acervo}</N> cadastradas.
              </>
            }
          >
            <h3 className="section-title mb-2">As mais ministradas</h3>
            <Barras
              itens={repertorio.maisTocadas.map((m) => ({
                rotulo: m.titulo,
                valor: m.vezes,
                nota: [m.artista, m.tom && `tom ${m.tom}`].filter(Boolean).join(" · "),
              }))}
              formatar={(n) => `${n} ${plural(n, "vez", "vezes")}`}
            />
          </Secao>
        )}

        {financas && (
          <Secao
            titulo="Dinheiro"
            frase={
              <>
                Entrou <N>{brl(financas.entradas)}</N> e saiu <N>{brl(financas.saidas)}</N>
                {", "}
                {financas.saldo >= 0 ? "sobrando" : "faltando"}{" "}
                <N>{brl(Math.abs(financas.saldo))}</N> no período.
              </>
            }
          >
            <div className="mb-5 grid grid-cols-2 gap-2">
              <Numerao valor={brl(financas.entradas)} rotulo="Entrou" tom="positivo" />
              <Numerao valor={brl(financas.saidas)} rotulo="Saiu" tom="negativo" />
            </div>

            <h3 className="section-title mb-2">Mês a mês</h3>
            <div className="card mb-5">
              <MonthlyChart data={financas.porMes} />
            </div>

            <h3 className="section-title mb-2">De onde veio</h3>
            <Barras
              itens={financas.entradasPorCategoria.map((c) => ({
                rotulo: labelOf(INCOME_CATEGORIES, c.rotulo),
                valor: c.valor,
              }))}
              formatar={brl}
              tom="verde"
            />

            <h3 className="section-title mb-2 mt-5">Para onde foi</h3>
            <Barras
              itens={financas.saidasPorCategoria.map((c) => ({
                rotulo: labelOf(EXPENSE_CATEGORIES, c.rotulo),
                valor: c.valor,
              }))}
              formatar={brl}
              tom="vermelho"
            />

            {projetos && projetos.projetos.length > 0 && (
              <>
                <h3 className="section-title mb-2 mt-6">Os projetos da banda</h3>
                <ul className="space-y-3">
                  {projetos.projetos.map((p) => {
                    const pct = p.meta > 0 ? (p.arrecadado / p.meta) * 100 : 0;
                    return (
                      <li key={p.nome} className="card">
                        <h4 className="text-sm font-semibold text-slate-100">{p.nome}</h4>
                        <p className="mb-2 mt-0.5 text-sm text-slate-400">
                          Já temos <strong className="text-slate-200">{brl(p.arrecadado)}</strong>{" "}
                          dos {brl(p.meta)} necessários.
                        </p>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Secao>
        )}

        {streaming && (
          <Secao
            titulo="Streaming"
            frase={
              <>
                As músicas foram ouvidas <N>{streaming.streams.toLocaleString("pt-BR")}</N>{" "}
                {plural(streaming.streams, "vez", "vezes")} nas plataformas, rendendo{" "}
                <N>{brl(streaming.total)}</N>.
              </>
            }
          >
            <h3 className="section-title mb-2">Por plataforma</h3>
            <Barras
              itens={streaming.porPlataforma.map((p) => ({
                rotulo: labelOf(PLATFORMS, p.rotulo),
                valor: p.valor,
                nota: `${p.streams.toLocaleString("pt-BR")} reproduções`,
              }))}
              formatar={brl}
            />
          </Secao>
        )}

        <footer className="mt-8 border-t border-ink-700 pt-4 text-center">
          <p className="text-xs text-slate-500">
            Cidade Music · Relatório gerado em {fmtDateLong(new Date())}
          </p>
        </footer>
      </article>
    </>
  );
}
