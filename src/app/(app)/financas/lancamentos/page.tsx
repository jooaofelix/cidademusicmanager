import { db } from "@/lib/db";
import { requireTreasurer } from "@/lib/session";
import { PageHeader, Chip, Tabs, EmptyState } from "@/components/ui";
import { brl, fmtDate, toInputDate } from "@/lib/format";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  labelOf,
} from "@/lib/constants";
import { createTransaction, deleteTransaction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LancamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  await requireTreasurer();

  const { tipo } = await searchParams;

  const [transactions, events, projects] = await Promise.all([
    db.transaction.findMany({
      where: tipo === "entradas" ? { type: "ENTRADA" } : tipo === "saidas" ? { type: "SAIDA" } : {},
      orderBy: { date: "desc" },
      take: 200,
      include: {
        event: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    db.event.findMany({ orderBy: { date: "desc" }, take: 40, select: { id: true, title: true, date: true } }),
    db.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Lançamentos" back={{ href: "/financas" }} />

      <Tabs
        current={`/financas/lancamentos${tipo ? `?tipo=${tipo}` : ""}`}
        items={[
          { href: "/financas/lancamentos", label: "Todos" },
          { href: "/financas/lancamentos?tipo=entradas", label: "Entradas" },
          { href: "/financas/lancamentos?tipo=saidas", label: "Saídas" },
        ]}
      />

      <form action={createTransaction} className="card mb-5 space-y-3">
        <h3 className="section-title">Novo lançamento</h3>

        <div className="grid grid-cols-2 gap-2">
          <select name="type" defaultValue="ENTRADA" className="input">
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </select>
          <input name="amount" inputMode="decimal" required placeholder="0,00" className="input" />
        </div>

        <select name="category" defaultValue="OFERTA" className="input">
          <optgroup label="Entradas">
            {INCOME_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
          <optgroup label="Saídas">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
        </select>

        <input name="description" placeholder="Descrição" className="input" />

        <div className="grid grid-cols-2 gap-2">
          <input name="date" type="date" defaultValue={toInputDate(new Date())} className="input" />
          <select name="method" defaultValue="" className="input">
            <option value="">Forma de pagamento</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select name="eventId" defaultValue="" className="input">
            <option value="">Sem evento</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {fmtDate(e.date)} · {e.title}
              </option>
            ))}
          </select>
          <select name="projectId" defaultValue="" className="input">
            <option value="">Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full">Lançar</button>
      </form>

      {transactions.length === 0 ? (
        <EmptyState title="Nenhum lançamento" description="Use o formulário acima para registrar." />
      ) : (
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="card-tight">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.description ||
                      labelOf(
                        t.type === "ENTRADA" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
                        t.category
                      )}
                  </p>
                  <p className="text-xs text-slate-500">{fmtDate(t.date)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip>
                      {labelOf(
                        t.type === "ENTRADA" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
                        t.category
                      )}
                    </Chip>
                    {t.method && <Chip>{t.method}</Chip>}
                    {t.event && <Chip tone="purple">{t.event.title}</Chip>}
                    {t.project && <Chip tone="blue">{t.project.name}</Chip>}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    t.type === "ENTRADA" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.type === "ENTRADA" ? "+" : "−"}
                  {brl(t.amountCents)}
                </span>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-slate-500">Opções</summary>
                <form action={deleteTransaction} className="mt-2">
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="btn-danger btn-sm w-full">Excluir lançamento</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
