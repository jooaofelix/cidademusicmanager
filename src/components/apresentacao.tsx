// Peças do relatório em formato de slide.
//
// Segue a identidade da banda: fundo creme com a marca em água, títulos em
// caixa alta com o gradiente laranja, números grandes e barras. Cada slide
// tem 16:9 e vira uma página no PDF, pronta para projetar.
//
// Estas peças não usam as cores do sistema (ink-*, slate-*), que trocam entre
// claro e escuro: a apresentação é sempre clara, porque é o material da
// banda e precisa sair igual em qualquer aparelho.

import type { ReactNode } from "react";

export const LARANJA = "#ff7401";
export const LARANJA_ESCURO = "#f2600c";
export const AMBAR = "#fbb03b";
export const CREME = "#ead8b6";
export const TINTA = "#2a2118";
export const TINTA_SUAVE = "#7a613c";

/** Um slide 16:9, com a marca nos cantos e a quebra de página na impressão. */
export function Slide({
  children,
  centralizado = false,
  fundoLaranja = false,
}: {
  children: ReactNode;
  centralizado?: boolean;
  fundoLaranja?: boolean;
}) {
  return (
    <section
      className={`slide ${centralizado ? "slide-centro" : ""} ${
        fundoLaranja ? "slide-laranja" : ""
      }`}
    >
      {!fundoLaranja && (
        <>
          <img className="slide-marca" src="/cm-marca.png" alt="" />
          <img className="slide-assinatura" src="/cm-assinatura.png" alt="" />
        </>
      )}
      <div className="slide-conteudo">{children}</div>
    </section>
  );
}

/** Título em caixa alta com o gradiente da marca. */
export function TituloSlide({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <header className="slide-cabecalho">
      <h2 className="slide-titulo">{children}</h2>
      {sub && <p className="slide-sub">{sub}</p>}
    </header>
  );
}

/** A conclusão da seção, em uma frase, com barra laranja à esquerda. */
export function FraseSlide({ children }: { children: ReactNode }) {
  return <p className="slide-frase">{children}</p>;
}

/** Número grande com bolinha, do jeito que a banda apresenta. */
export function NumeroGrande({
  valor,
  rotulo,
  icone,
}: {
  valor: string;
  rotulo: string;
  icone: string;
}) {
  return (
    <div className="num">
      <span className="num-bola" aria-hidden>
        {icone}
      </span>
      <span>
        <span className="num-valor">{valor}</span>
        <span className="num-rotulo">{rotulo}</span>
      </span>
    </div>
  );
}

export function LinhaDeNumeros({ children }: { children: ReactNode }) {
  return <div className="numeros">{children}</div>;
}

/** Barras horizontais com o valor escrito ao lado. */
export function BarrasSlide({
  itens,
  formatar = (n) => String(n),
}: {
  itens: { rotulo: string; valor: number; nota?: string }[];
  formatar?: (n: number) => string;
}) {
  if (itens.length === 0) {
    return <p className="slide-vazio">Nada registrado neste período.</p>;
  }

  const maior = Math.max(...itens.map((i) => i.valor), 1);

  return (
    <ul className="barras">
      {itens.map((i) => (
        <li key={i.rotulo} className="barra">
          <div className="barra-topo">
            <span className="barra-nome">{i.rotulo}</span>
            <span className="barra-valor">{formatar(i.valor)}</span>
          </div>
          <div className="barra-trilho">
            <div
              className="barra-preenche"
              style={{ width: `${Math.max((i.valor / maior) * 100, i.valor > 0 ? 1.5 : 0)}%` }}
            />
          </div>
          {i.nota && <span className="barra-nota">{i.nota}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Colunas de entrada e saída por mês.
 *
 * Verde e vermelho separados o bastante para daltonismo, e cada mês traz o
 * saldo escrito embaixo — a cor nunca é o único indicador.
 */
export function ColunasMensais({
  dados,
  formatar,
}: {
  dados: { label: string; income: number; expense: number }[];
  formatar: (n: number) => string;
}) {
  if (dados.length === 0) return <p className="slide-vazio">Sem lançamentos no período.</p>;

  const maior = Math.max(...dados.flatMap((d) => [d.income, d.expense]), 1);

  return (
    <figure className="grafico">
      <figcaption className="grafico-legenda">
        <span>
          <i style={{ background: "#0f9d58" }} /> Entradas
        </span>
        <span>
          <i style={{ background: "#d93025" }} /> Saídas
        </span>
      </figcaption>
      <div className="grafico-colunas">
        {dados.map((d) => (
          <div key={d.label} className="mes">
            <div className="mes-barras">
              <div
                className="col col-entrada"
                style={{ height: `${(d.income / maior) * 100}%` }}
                title={`${d.label}: ${formatar(d.income)}`}
              />
              <div
                className="col col-saida"
                style={{ height: `${(d.expense / maior) * 100}%` }}
                title={`${d.label}: ${formatar(d.expense)}`}
              />
            </div>
            <span className="mes-nome">{d.label}</span>
            <span className="mes-saldo">
              {d.income - d.expense >= 0 ? "+" : "−"}
              {formatar(Math.abs(d.income - d.expense)).replace("R$", "").trim()}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Progresso de um projeto rumo à meta. */
export function Projeto({
  nome,
  arrecadado,
  meta,
  formatar,
}: {
  nome: string;
  arrecadado: number;
  meta: number;
  formatar: (n: number) => string;
}) {
  const pct = meta > 0 ? Math.min((arrecadado / meta) * 100, 100) : 0;

  return (
    <li className="projeto">
      <div className="projeto-topo">
        <span className="projeto-nome">{nome}</span>
        <span className="projeto-pct">{pct.toFixed(0)}%</span>
      </div>
      <div className="barra-trilho">
        <div className="barra-preenche" style={{ width: `${pct}%` }} />
      </div>
      <span className="projeto-nota">
        {formatar(arrecadado)} de {formatar(meta)}
      </span>
    </li>
  );
}
