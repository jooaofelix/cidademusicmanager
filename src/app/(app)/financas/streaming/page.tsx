import { db } from "@/lib/db";
import { PageHeader, EmptyState, Stat, Tabs, Chip, ProgressBar } from "@/components/ui";
import { brl, currentPeriod, periodLabel } from "@/lib/format";
import { PLATFORMS, labelOf } from "@/lib/constants";
import { deleteRoyalty, saveRoyalty } from "../actions";

export const dynamic = "force-dynamic";

export default async function StreamingPage() {
  const [entries, songs] = await Promise.all([
    db.royaltyEntry.findMany({
      orderBy: [{ period: "desc" }, { platform: "asc" }],
      include: { song: { select: { id: true, title: true } } },
    }),
    db.song.findMany({ where: { active: true }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  const total = entries.reduce((a, e) => a + e.amountCents, 0);
  const totalStreams = entries.reduce((a, e) => a + (e.streams ?? 0), 0);

  const byPlatform = PLATFORMS.map((p) => ({
    ...p,
    total: entries.filter((e) => e.platform === p.value).reduce((a, e) => a + e.amountCents, 0),
    streams: entries
      .filter((e) => e.platform === p.value)
      .reduce((a, e) => a + (e.streams ?? 0), 0),
  }))
    .filter((p) => p.total > 0 || p.streams > 0)
    .sort((a, b) => b.total - a.total);

  // Agrupa por período
  const periods = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = periods.get(e.period) ?? [];
    list.push(e);
    periods.set(e.period, list);
  }

  return (
    <>
      <PageHeader
        title="Streaming"
        subtitle="Quanto as músicas renderam no Spotify, Apple Music e afins"
        back={{ href: "/financas" }}
      />

      <Tabs
        current="/financas/streaming"
        items={[
          { href: "/financas", label: "Dashboard" },
          { href: "/financas/lancamentos", label: "Lançamentos" },
          { href: "/financas/projetos", label: "Projetos" },
          { href: "/financas/streaming", label: "Streaming" },
        ]}
      />

      <details className="card mb-4">
        <summary className="cursor-pointer text-sm font-semibold text-brand-300">
          Dá para puxar isso automaticamente? Leia antes de começar
        </summary>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
          <p>
            Resposta curta: <strong>não dá para puxar tudo automaticamente</strong> — e o
            motivo é como as plataformas funcionam.
          </p>
          <ul className="ml-4 list-disc space-y-1.5 text-slate-400">
            <li>
              <strong className="text-slate-300">Spotify e Apple Music não pagam vocês.</strong>{" "}
              Quem paga é a distribuidora (ONErpm, DistroKid, CD Baby, Believe…). O Spotify for
              Artists e o Apple Music for Artists mostram audiência, não dinheiro, e não têm
              API pública de royalties.
            </li>
            <li>
              <strong className="text-slate-300">O número verdadeiro</strong> está no relatório
              mensal da distribuidora — ele já vem com todas as plataformas somadas.
            </li>
          </ul>
          <p className="rounded-xl border border-brand-900/60 bg-brand-950/30 px-3 py-2.5 text-xs text-brand-200">
            <strong>Como usar na prática:</strong> uma vez por mês, abra o relatório da
            distribuidora e lance aqui o valor de cada plataforma. Leva 2 minutos e o
            histórico fica todo no dashboard.
          </p>
        </div>
      </details>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Total recebido" value={brl(total)} tone="positive" />
        <Stat
          label="Reproduções"
          value={totalStreams.toLocaleString("pt-BR")}
          tone="brand"
          hint="Onde vocês preencheram"
        />
      </div>

      {byPlatform.length > 0 && (
        <section className="card mb-4">
          <h2 className="section-title mb-3">Por plataforma</h2>
          <ul className="space-y-3">
            {byPlatform.map((p) => (
              <li key={p.value}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-slate-300">{p.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {brl(p.total)}
                    {p.streams > 0 && (
                      <span className="ml-1.5 text-xs text-slate-600">
                        {p.streams.toLocaleString("pt-BR")} plays
                      </span>
                    )}
                  </span>
                </div>
                <ProgressBar value={total > 0 ? (p.total / total) * 100 : 0} tone="green" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <form action={saveRoyalty} className="card mb-5 space-y-3">
        <h3 className="section-title">Lançar relatório do mês</h3>

        <div className="grid grid-cols-2 gap-2">
          <select name="platform" required defaultValue="" className="input">
            <option value="" disabled>Plataforma</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            name="period"
            type="month"
            required
            defaultValue={currentPeriod()}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input name="amount" inputMode="decimal" placeholder="Valor R$" className="input" />
          <input name="streams" type="number" inputMode="numeric" placeholder="Reproduções" className="input" />
        </div>

        <select name="songId" defaultValue="" className="input">
          <option value="">Todas as músicas (total do mês)</option>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>

        <input name="notes" placeholder="Observação (ex: relatório ONErpm)" className="input" />

        <label className="flex items-start gap-2.5 rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5">
          <input type="checkbox" name="addToCash" className="mt-0.5 h-4 w-4 accent-brand-500" />
          <span className="text-xs text-slate-300">
            Já caiu na conta — lançar também como entrada no caixa
            <span className="mt-0.5 block text-slate-500">
              Marque só quando o dinheiro entrou de fato, para o caixa não inflar.
            </span>
          </span>
        </label>

        <button type="submit" className="btn-primary w-full">Salvar</button>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhum relatório lançado"
          description="Comece pelo último mês fechado da distribuidora."
        />
      ) : (
        <div className="space-y-4">
          {[...periods.entries()].map(([period, list]) => {
            const subtotal = list.reduce((a, e) => a + e.amountCents, 0);
            return (
              <section key={period}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="section-title">{periodLabel(period)}</h2>
                  <span className="text-sm font-bold tabular-nums text-emerald-400">
                    {brl(subtotal)}
                  </span>
                </div>
                <ul className="space-y-2">
                  {list.map((e) => (
                    <li key={e.id} className="card-tight">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{labelOf(PLATFORMS, e.platform)}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {e.song && <Chip tone="purple">{e.song.title}</Chip>}
                            {e.streams != null && (
                              <Chip>{e.streams.toLocaleString("pt-BR")} plays</Chip>
                            )}
                          </div>
                          {e.notes && <p className="mt-1 text-xs text-slate-500">{e.notes}</p>}
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-400">
                          {brl(e.amountCents)}
                        </span>
                      </div>
                      <form action={deleteRoyalty} className="mt-2">
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="btn-ghost btn-sm w-full text-xs">
                          Remover
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
