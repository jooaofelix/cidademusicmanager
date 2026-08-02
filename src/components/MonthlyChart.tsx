import { brl } from "@/lib/format";

export type MonthPoint = { label: string; income: number; expense: number };

/**
 * Barras agrupadas entrada x saída por mês.
 * Verde/vermelho ficam na faixa 6–8 de separação para daltonismo, então as
 * séries carregam também legenda, posição fixa (entrada sempre à esquerda) e
 * rótulo de valor — a cor nunca é o único indicador.
 */
export function MonthlyChart({ data }: { data: MonthPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-600 px-4 py-8 text-center text-sm text-slate-500">
        Sem lançamentos para montar o gráfico.
      </p>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const H = 132; // altura útil das barras

  return (
    <figure>
      <figcaption className="mb-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#199e70" }} />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#e66767" }} />
          Saídas
        </span>
      </figcaption>

      <div className="no-scrollbar overflow-x-auto">
        <div
          className="flex min-w-full items-end gap-3"
          style={{ height: H + 34, minWidth: data.length * 52 }}
        >
          {data.map((d) => {
            const ih = Math.round((d.income / max) * H);
            const eh = Math.round((d.expense / max) * H);
            return (
              <div key={d.label} className="flex min-w-[44px] flex-1 flex-col items-center">
                <div className="flex h-[132px] w-full items-end justify-center gap-1">
                  <div
                    title={`${d.label} · entradas ${brl(d.income)}`}
                    className="w-[42%] rounded-t"
                    style={{
                      height: Math.max(ih, d.income > 0 ? 3 : 0),
                      background: "#199e70",
                    }}
                  />
                  <div
                    title={`${d.label} · saídas ${brl(d.expense)}`}
                    className="w-[42%] rounded-t"
                    style={{
                      height: Math.max(eh, d.expense > 0 ? 3 : 0),
                      background: "#e66767",
                    }}
                  />
                </div>
                <span className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">
                  {d.label}
                </span>
                <span className="text-[10px] tabular-nums text-slate-600">
                  {d.income - d.expense >= 0 ? "+" : "−"}
                  {brl(Math.abs(d.income - d.expense)).replace("R$", "").trim()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-slate-500">Ver como tabela</summary>
        <div className="no-scrollbar mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 pr-3 font-medium">Mês</th>
                <th className="py-1 pr-3 text-right font-medium">Entradas</th>
                <th className="py-1 pr-3 text-right font-medium">Saídas</th>
                <th className="py-1 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((d) => (
                <tr key={d.label} className="border-t border-ink-700">
                  <td className="py-1.5 pr-3">{d.label}</td>
                  <td className="py-1.5 pr-3 text-right text-emerald-400">{brl(d.income)}</td>
                  <td className="py-1.5 pr-3 text-right text-red-400">{brl(d.expense)}</td>
                  <td className="py-1.5 text-right">{brl(d.income - d.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
