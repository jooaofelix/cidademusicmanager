import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, Stat, ProgressBar, Tabs } from "@/components/ui";
import { MonthlyChart, type MonthPoint } from "@/components/MonthlyChart";
import { brl, fmtDate, periodLabel } from "@/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, labelOf } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function FinancasPage() {
  const [transactions, projects, royalties] = await Promise.all([
    db.transaction.findMany({
      orderBy: { date: "desc" },
      include: { event: { select: { id: true, title: true } } },
    }),
    db.project.findMany({
      where: { status: { not: "CONCLUIDO" } },
      orderBy: { position: "asc" },
      include: { transactions: { select: { amountCents: true, type: true } } },
    }),
    db.royaltyEntry.findMany({ orderBy: { period: "desc" } }),
  ]);

  const income = transactions.filter((t) => t.type === "ENTRADA");
  const expense = transactions.filter((t) => t.type === "SAIDA");

  const totalIn = income.reduce((a, t) => a + t.amountCents, 0);
  const totalOut = expense.reduce((a, t) => a + t.amountCents, 0);
  const balance = totalIn - totalOut;

  const offerings = income
    .filter((t) => t.category === "OFERTA")
    .reduce((a, t) => a + t.amountCents, 0);
  const streamingTotal = royalties.reduce((a, r) => a + r.amountCents, 0);

  // Mês corrente
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthIn = income
    .filter((t) => t.date >= monthStart)
    .reduce((a, t) => a + t.amountCents, 0);
  const monthOut = expense
    .filter((t) => t.date >= monthStart)
    .reduce((a, t) => a + t.amountCents, 0);

  // Série dos últimos 6 meses
  const months: MonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      label: periodLabel(key),
      income: income
        .filter((t) => t.date >= d && t.date < next)
        .reduce((a, t) => a + t.amountCents, 0),
      expense: expense
        .filter((t) => t.date >= d && t.date < next)
        .reduce((a, t) => a + t.amountCents, 0),
    });
  }

  // Composição das entradas
  const byIncomeCat = INCOME_CATEGORIES.map((c) => ({
    ...c,
    total: income.filter((t) => t.category === c.value).reduce((a, t) => a + t.amountCents, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const byExpenseCat = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: expense.filter((t) => t.category === c.value).reduce((a, t) => a + t.amountCents, 0),
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <>
      <PageHeader title="Finanças" subtitle="Caixa, entradas, saídas e projetos" />

      <Tabs
        current="/financas"
        items={[
          { href: "/financas", label: "Dashboard" },
          { href: "/financas/lancamentos", label: "Lançamentos" },
          { href: "/financas/projetos", label: "Projetos" },
          { href: "/financas/streaming", label: "Streaming" },
        ]}
      />

      <div className="card mb-4 text-center">
        <p className="text-xs uppercase tracking-wide text-slate-400">Em caixa</p>
        <p
          className={`mt-1 text-4xl font-black tabular-nums ${
            balance >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {brl(balance)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {transactions.length} lançamento(s) registrados
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Entradas (total)" value={brl(totalIn)} tone="positive" />
        <Stat label="Saídas (total)" value={brl(totalOut)} tone="negative" />
        <Stat label="Entrou este mês" value={brl(monthIn)} tone="positive" />
        <Stat label="Saiu este mês" value={brl(monthOut)} tone="negative" />
        <Stat label="Ofertas recebidas" value={brl(offerings)} tone="brand" hint="Somente categoria Oferta" />
        <Stat label="Streaming" value={brl(streamingTotal)} tone="brand" hint="Relatórios lançados" />
      </div>

      <section className="card mb-4">
        <h2 className="section-title mb-3">Últimos 6 meses</h2>
        <MonthlyChart data={months} />
      </section>

      {byIncomeCat.length > 0 && (
        <section className="card mb-4">
          <h2 className="section-title mb-3">De onde vêm as entradas</h2>
          <ul className="space-y-3">
            {byIncomeCat.map((c) => (
              <li key={c.value}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {brl(c.total)}
                    <span className="ml-1.5 text-xs text-slate-600">
                      {Math.round((c.total / totalIn) * 100)}%
                    </span>
                  </span>
                </div>
                <ProgressBar value={(c.total / totalIn) * 100} tone="green" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {byExpenseCat.length > 0 && (
        <section className="card mb-4">
          <h2 className="section-title mb-3">Para onde vão as saídas</h2>
          <ul className="space-y-3">
            {byExpenseCat.map((c) => (
              <li key={c.value}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {brl(c.total)}
                    <span className="ml-1.5 text-xs text-slate-600">
                      {Math.round((c.total / totalOut) * 100)}%
                    </span>
                  </span>
                </div>
                <ProgressBar value={(c.total / totalOut) * 100} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section className="card mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Projetos e sonhos</h2>
            <Link href="/financas/projetos" className="text-xs text-brand-400 underline underline-offset-2">
              ver todos
            </Link>
          </div>
          <ul className="space-y-4">
            {projects.slice(0, 3).map((p) => {
              const saved = p.transactions
                .filter((t) => t.type === "ENTRADA")
                .reduce((a, t) => a + t.amountCents, 0);
              const pct = p.targetCents > 0 ? (saved / p.targetCents) * 100 : 0;
              return (
                <li key={p.id}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {brl(saved)} / {brl(p.targetCents)}
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={pct >= 100 ? "green" : "brand"} />
                  <p className="mt-1 text-xs text-slate-500">
                    Faltam {brl(Math.max(0, p.targetCents - saved))} · {Math.round(pct)}% concluído
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Últimos lançamentos</h2>
          <Link href="/financas/lancamentos" className="text-xs text-brand-400 underline underline-offset-2">
            ver todos
          </Link>
        </div>
        {transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum lançamento ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {transactions.slice(0, 8).map((t) => (
              <li key={t.id} className="card-tight flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.description ||
                      labelOf(
                        t.type === "ENTRADA" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
                        t.category
                      )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmtDate(t.date)}
                    {t.event ? ` · ${t.event.title}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    t.type === "ENTRADA" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.type === "ENTRADA" ? "+" : "−"}
                  {brl(t.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
