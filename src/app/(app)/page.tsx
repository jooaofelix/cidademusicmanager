import Link from "next/link";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { Chip, Stat, EmptyState } from "@/components/ui";
import { brl, fmtDateLong, relativeDay } from "@/lib/format";
import { EVENT_TYPES, labelOf } from "@/lib/constants";
import { respondLineup } from "./agenda/actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await requireMember();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [nextEvents, myPending, myTasks, transactions] = await Promise.all([
    db.event.findMany({
      where: { date: { gte: today }, status: { not: "CANCELADO" } },
      orderBy: { date: "asc" },
      take: 3,
      include: {
        lineups: { select: { status: true } },
        _count: { select: { setlist: true } },
      },
    }),
    db.lineup.findMany({
      where: {
        memberId: me.id,
        status: "PENDENTE",
        event: { date: { gte: today }, status: { not: "CANCELADO" } },
      },
      orderBy: { event: { date: "asc" } },
      include: { event: { select: { id: true, title: true, date: true, startTime: true } } },
    }),
    db.task.findMany({
      where: { assigneeId: me.id, done: false },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }],
      take: 5,
      include: { event: { select: { id: true, title: true } } },
    }),
    db.transaction.findMany({ select: { type: true, amountCents: true } }),
  ]);

  const balance = transactions.reduce(
    (a, t) => a + (t.type === "ENTRADA" ? t.amountCents : -t.amountCents),
    0
  );

  const firstName = me.name.split(" ")[0];

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Olá, {firstName} 👋</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {me.instrument} · Cidade Music
        </p>
      </header>

      {myPending.length > 0 && (
        <section className="mb-5">
          <h2 className="section-title mb-2">Aguardando seu OK</h2>
          <ul className="space-y-2">
            {myPending.map((l) => (
              <li key={l.id} className="card tint-amber">
                <Link href={`/agenda/${l.event.id}`} className="block">
                  <p className="text-sm font-semibold">{l.event.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {fmtDateLong(l.event.date)}
                    {l.event.startTime ? ` · ${l.event.startTime}` : ""} · você em{" "}
                    <strong className="text-slate-300">{l.instrument}</strong>
                  </p>
                </Link>
                <div className="mt-3 flex gap-2">
                  <form action={respondLineup} className="flex-1">
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value="CONFIRMADO" />
                    <button
                      type="submit"
                      className="btn btn-sm w-full border tint-green"
                    >
                      ✓ Confirmo presença
                    </button>
                  </form>
                  <form action={respondLineup} className="flex-1">
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value="RECUSADO" />
                    <button type="submit" className="btn-danger btn-sm w-full">
                      ✕ Não posso
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Próximos eventos</h2>
          <Link href="/agenda" className="text-xs text-brand-400 underline underline-offset-2">
            ver agenda
          </Link>
        </div>

        {nextEvents.length === 0 ? (
          <EmptyState
            title="Nada marcado"
            description="Crie o próximo culto ou ensaio."
            action={
              <Link href="/agenda/novo" className="btn-primary">
                Novo evento
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {nextEvents.map((e) => {
              const confirmed = e.lineups.filter((l) => l.status === "CONFIRMADO").length;
              return (
                <li key={e.id}>
                  <Link href={`/agenda/${e.id}`} className="card-tight block transition hover:border-ink-600">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{e.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {fmtDateLong(e.date)}
                          {e.startTime ? ` · ${e.startTime}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Chip tone="blue">{labelOf(EVENT_TYPES, e.type)}</Chip>
                          <Chip tone={confirmed === e.lineups.length && confirmed > 0 ? "green" : "amber"}>
                            {confirmed}/{e.lineups.length} OK
                          </Chip>
                          <Chip>{e._count.setlist} músicas</Chip>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-ink-800 px-2 py-1 text-[11px] text-slate-400">
                        {relativeDay(e.date)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {myTasks.length > 0 && (
        <section className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Suas demandas</h2>
            <Link href="/checklist?ver=minhas" className="text-xs text-brand-400 underline underline-offset-2">
              ver todas
            </Link>
          </div>
          <ul className="space-y-2">
            {myTasks.map((t) => (
              <li key={t.id} className="card-tight">
                <p className="text-sm font-medium">{t.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Chip tone={t.priority === "ALTA" ? "red" : "slate"}>{t.priority}</Chip>
                  {t.event && <Chip tone="purple">{t.event.title}</Chip>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-5 grid grid-cols-2 gap-2">
        <Link href="/financas">
          <Stat label="Em caixa" value={brl(balance)} tone={balance >= 0 ? "positive" : "negative"} />
        </Link>
        <Link href="/repertorio">
          <Stat label="Repertório" value="Ver músicas" tone="brand" />
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Link href="/agenda/novo" className="btn-ghost py-3">+ Evento</Link>
        <Link href="/repertorio/nova" className="btn-ghost py-3">+ Música</Link>
        <Link href="/checklist" className="btn-ghost py-3">Checklist</Link>
        {me.isTreasurer && (
          <Link href="/financas/lancamentos" className="btn-ghost py-3">+ Lançamento</Link>
        )}
      </section>

      {me.isReporter && (
        <Link href="/relatorios" className="card mt-4 flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-100">
              Relatório do ministério
            </span>
            <span className="block text-xs text-slate-500">
              Monte a apresentação com os números do período
            </span>
          </span>
          <span className="shrink-0 text-brand-500" aria-hidden>
            →
          </span>
        </Link>
      )}
    </>
  );
}
