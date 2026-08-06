// O relatório em formato de apresentação.
//
// Mesmos números do relatório comum, desenhados na identidade da banda e em
// slides 16:9 — para projetar numa reunião ou virar PDF. Fica fora do grupo
// (app) de propósito: aqui não entram cabeçalho nem barra de navegação, e o
// tema claro/escuro do sistema não se aplica.

import { requireReporter } from "@/lib/session";
import { brl, fmtDateLong, fmtPeriodoCurto } from "@/lib/format";
import {
  EVENT_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PLATFORMS,
  labelOf,
} from "@/lib/constants";
import {
  type AreaId,
  apurarAgenda,
  apurarFinancas,
  apurarOrganizacao,
  apurarProjetos,
  apurarRepertorio,
  apurarStreaming,
  ehArea,
  ehPeriodo,
  intervaloDe,
} from "@/lib/relatorio";
import {
  BarrasSlide,
  ColunasMensais,
  FraseSlide,
  LinhaDeNumeros,
  NumeroGrande,
  Projeto,
  Slide,
  SlideCapa,
  TituloSlide,
} from "@/components/apresentacao";
import { Controles } from "./Controles";
import "./apresentacao.css";

export const dynamic = "force-dynamic";

type Busca = { periodo?: string; area?: string | string[] };

export default async function ApresentacaoPage({
  searchParams,
}: {
  searchParams: Promise<Busca>;
}) {
  const eu = await requireReporter();
  const { periodo: periodoBruto, area: areaBruta } = await searchParams;

  const periodo = periodoBruto && ehPeriodo(periodoBruto) ? periodoBruto : "90d";
  const { de, ate, rotulo: rotuloPeriodo, futuro } = intervaloDe(periodo);

  const escolhidas: AreaId[] =
    areaBruta === undefined
      ? (["agenda", "repertorio", "financas"] as AreaId[])
      : (Array.isArray(areaBruta) ? areaBruta : [areaBruta]).filter(ehArea);

  const tem = (a: AreaId) => escolhidas.includes(a);

  const [agenda, repertorio, organizacao, financas, projetos, streaming] = await Promise.all([
    tem("agenda") ? apurarAgenda(de, ate, futuro) : null,
    tem("repertorio") ? apurarRepertorio(de, ate) : null,
    tem("agenda") ? apurarOrganizacao(de, ate) : null,
    tem("financas") ? apurarFinancas(de, ate) : null,
    tem("financas") ? apurarProjetos() : null,
    tem("streaming") ? apurarStreaming(de, ate) : null,
  ]);

  const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);
  const vezes = (n: number) => `${n} ${plural(n, "vez", "vezes")}`;

  const voltar = `/relatorios?periodo=${periodo}${escolhidas.map((a) => `&area=${a}`).join("")}`;

  // Quantas ocasiões aconteceram fora da própria igreja: é o número que mais
  // interessa a quem acompanha o alcance do ministério.
  const foraDaIgreja =
    agenda?.porTipo
      .filter((t) => ["EVENTO", "REDE", "RUA"].includes(t.rotulo))
      .reduce((a, t) => a + t.quantidade, 0) ?? 0;

  return (
    <div className="deck">
      <Controles voltarPara={voltar} />

      {/* ---------------------------------------------------------------- */}
      <SlideCapa>
        <h1 className="capa-titulo">Relatório de Ações</h1>
        <p className="capa-periodo">{rotuloPeriodo}</p>
        <p className="capa-rodape">
          Emitido por {eu.name} em {fmtDateLong(new Date())}
        </p>
      </SlideCapa>

      {/* ---------------------------------------------------------------- */}
      {agenda && (
        <Slide>
          <TituloSlide sub={rotuloPeriodo}>Onde servimos</TituloSlide>

          <FraseSlide>
            {futuro ? (
              <>
                A equipe tem <b>{agenda.total}</b>{" "}
                {plural(agenda.total, "compromisso marcado", "compromissos marcados")} para o
                período.
              </>
            ) : (
              <>
                No período a equipe serviu em <b>{agenda.realizados}</b>{" "}
                {plural(agenda.realizados, "ocasião", "ocasiões")}
                {agenda.proximos > 0 && (
                  <>
                    , e há <b>{agenda.proximos}</b>{" "}
                    {plural(agenda.proximos, "compromisso marcado", "compromissos marcados")} pela
                    frente
                  </>
                )}
                .
              </>
            )}
          </FraseSlide>

          <LinhaDeNumeros>
            <NumeroGrande
              icone="♪"
              valor={String(futuro ? agenda.total : agenda.realizados)}
              rotulo={plural(agenda.total, "compromisso", "compromissos")}
            />
            <NumeroGrande
              icone="◎"
              valor={String(foraDaIgreja)}
              rotulo="fora da nossa igreja"
            />
            {organizacao && organizacao.total > 0 && (
              <NumeroGrande
                icone="✓"
                valor={`${organizacao.concluidas}/${organizacao.total}`}
                rotulo="tarefas de preparação"
              />
            )}
          </LinhaDeNumeros>

          <BarrasSlide
            itens={agenda.porTipo.slice(0, 5).map((t) => ({
              rotulo: labelOf(EVENT_TYPES, t.rotulo),
              valor: t.quantidade,
            }))}
            formatar={vezes}
          />
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {agenda && agenda.ultimos.length > 0 && (
        <Slide>
          <TituloSlide sub={futuro ? "O que já está marcado" : "Os mais recentes"}>
            Compromissos
          </TituloSlide>

          <ul className="barras">
            {agenda.ultimos.slice(0, 6).map((e) => (
              <li key={e.id} className="barra">
                <div className="barra-topo">
                  <span className="barra-nome">{e.title}</span>
                  <span className="barra-valor">{fmtPeriodoCurto(e.date, e.endDate)}</span>
                </div>
                <span className="barra-nota">
                  {labelOf(EVENT_TYPES, e.type)}
                  {e.musicas > 0 && ` · ${e.musicas} músicas na ordem de culto`}
                </span>
              </li>
            ))}
          </ul>
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {repertorio && (
        <Slide>
          <TituloSlide sub={rotuloPeriodo}>Músicas</TituloSlide>

          <FraseSlide>
            {futuro ? "Já estão escolhidas " : "Foram ministradas "}
            <b>{repertorio.distintasNoPeriodo}</b>{" "}
            {plural(repertorio.distintasNoPeriodo, "música diferente", "músicas diferentes")}, de um
            repertório de <b>{repertorio.acervo}</b> cadastradas.
          </FraseSlide>

          <LinhaDeNumeros>
            <NumeroGrande
              icone="♫"
              valor={String(repertorio.distintasNoPeriodo)}
              rotulo="músicas diferentes"
            />
            <NumeroGrande icone="♪" valor={String(repertorio.execucoes)} rotulo="execuções" />
            <NumeroGrande icone="◈" valor={String(repertorio.acervo)} rotulo="no repertório" />
          </LinhaDeNumeros>

          <BarrasSlide
            itens={repertorio.maisTocadas.slice(0, 4).map((m) => ({
              rotulo: m.titulo,
              valor: m.vezes,
              nota: [m.artista, m.tom && `tom ${m.tom}`].filter(Boolean).join(" · "),
            }))}
            formatar={vezes}
          />
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {financas && (
        <Slide>
          <TituloSlide sub={rotuloPeriodo}>Dinheiro</TituloSlide>

          <FraseSlide>
            {financas.lancamentos === 0 ? (
              <>Nenhum lançamento registrado neste período.</>
            ) : (
              <>
                Entrou <b>{brl(financas.entradas)}</b> e saiu <b>{brl(financas.saidas)}</b>,{" "}
                {financas.saldo >= 0 ? "sobrando" : "faltando"}{" "}
                <b>{brl(Math.abs(financas.saldo))}</b> no período.
              </>
            )}
          </FraseSlide>

          <LinhaDeNumeros>
            <NumeroGrande icone="↑" valor={brl(financas.entradas)} rotulo="entrou" />
            <NumeroGrande icone="↓" valor={brl(financas.saidas)} rotulo="saiu" />
            <NumeroGrande icone="=" valor={brl(financas.saldo)} rotulo="saldo do período" />
          </LinhaDeNumeros>

          <ColunasMensais dados={financas.porMes} formatar={brl} />
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {financas && financas.lancamentos > 0 && (
        <Slide>
          <TituloSlide sub="De onde veio e para onde foi">O caminho do recurso</TituloSlide>

          <div className="duas-colunas">
            <div>
              <p className="coluna-titulo">De onde veio</p>
              <BarrasSlide
                itens={financas.entradasPorCategoria.map((c) => ({
                  rotulo: labelOf(INCOME_CATEGORIES, c.rotulo),
                  valor: c.valor,
                }))}
                formatar={brl}
              />
            </div>
            <div>
              <p className="coluna-titulo">Para onde foi</p>
              <BarrasSlide
                itens={financas.saidasPorCategoria.map((c) => ({
                  rotulo: labelOf(EXPENSE_CATEGORIES, c.rotulo),
                  valor: c.valor,
                }))}
                formatar={brl}
              />
            </div>
          </div>
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {projetos && projetos.projetos.length > 0 && (
        <Slide>
          <TituloSlide sub="O que a banda está construindo">Projetos</TituloSlide>

          <ul className="projetos">
            {projetos.projetos.slice(0, 4).map((p) => (
              <Projeto
                key={p.nome}
                nome={p.nome}
                arrecadado={p.arrecadado}
                meta={p.meta}
                formatar={brl}
              />
            ))}
          </ul>
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      {streaming && (
        <Slide>
          <TituloSlide sub={rotuloPeriodo}>Streaming</TituloSlide>

          <FraseSlide>
            {streaming.porPlataforma.length === 0 ? (
              <>Nenhum relatório de plataforma lançado neste período.</>
            ) : (
              <>
                As músicas foram ouvidas <b>{streaming.streams.toLocaleString("pt-BR")}</b>{" "}
                {plural(streaming.streams, "vez", "vezes")} nas plataformas, rendendo{" "}
                <b>{brl(streaming.total)}</b>.
              </>
            )}
          </FraseSlide>

          <LinhaDeNumeros>
            <NumeroGrande
              icone="▶"
              valor={streaming.streams.toLocaleString("pt-BR")}
              rotulo="reproduções"
            />
            <NumeroGrande icone="$" valor={brl(streaming.total)} rotulo="em repasses" />
          </LinhaDeNumeros>

          <BarrasSlide
            itens={streaming.porPlataforma.map((p) => ({
              rotulo: labelOf(PLATFORMS, p.rotulo),
              valor: p.valor,
              nota: `${p.streams.toLocaleString("pt-BR")} reproduções`,
            }))}
            formatar={brl}
          />
        </Slide>
      )}

      {/* ---------------------------------------------------------------- */}
      <SlideCapa />
    </div>
  );
}
