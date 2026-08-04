import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { PageHeader, EmptyState, Chip } from "@/components/ui";
import { diasDoEvento, fmtPeriodoEvento, relativeDay } from "@/lib/format";
import { EVENT_TYPES, labelOf } from "@/lib/constants";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  PLANEJADO: "slate",
  CONFIRMADO: "blue",
  REALIZADO: "green",
  CANCELADO: "red",
} as const;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const me = await getCurrentMember();
  const showPast = filtro === "passados";

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const events = await db.event.findMany({
    where: showPast ? { date: { lt: today } } : { date: { gte: today } },
    orderBy: { date: showPast ? "desc" : "asc" },
    take: showPast ? 40 : undefined,
    include: {
      _count: { select: { setlist: true, tasks: true } },
      tasks: { where: { done: false }, select: { id: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={showPast ? "Eventos que já aconteceram" : "Próximos cultos, ensaios e eventos"}
        action={
          <Link href="/agenda/novo" className="btn-primary btn-sm shrink-0">
            + Novo
          </Link>
        }
      />

      <div className="mb-4 flex gap-2">
        <Link
          href="/agenda"
          className={`chip ${!showPast ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
        >
          Próximos
        </Link>
        <Link
          href="/agenda?filtro=passados"
          className={`chip ${showPast ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
        >
          Realizados
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title={showPast ? "Nenhum evento passado" : "Nenhum evento marcado"}
          description={
            showPast
              ? "Assim que vocês realizarem eventos, eles aparecem aqui com a OC e os feedbacks."
              : "Crie o próximo culto ou ensaio para escalar a equipe."
          }
          action={
            !showPast && (
              <Link href="/agenda/novo" className="btn-primary">
                Criar evento
              </Link>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const openTasks = e.tasks.length;
            const dias = diasDoEvento(e.date, e.endDate);

            return (
              <li key={e.id}>
                <Link href={`/agenda/${e.id}`} className="card block transition hover:border-ink-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <Chip tone={STATUS_TONE[e.status as keyof typeof STATUS_TONE] ?? "slate"}>
                          {labelOf(EVENT_TYPES, e.type)}
                        </Chip>
                        {e.status === "CANCELADO" && <Chip tone="red">Cancelado</Chip>}
                      </div>
                      <h2 className="truncate text-base font-semibold">{e.title}</h2>
                      <p className="mt-0.5 text-sm text-slate-400">
                        {fmtPeriodoEvento(e.date, e.endDate)}
                        {e.startTime ? ` · ${e.startTime}` : ""}
                      </p>
                      {e.location && (
                        <p className="mt-0.5 truncate text-sm text-slate-500">{e.location}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-lg bg-ink-800 px-2 py-1 text-[11px] font-medium text-slate-400">
                      {relativeDay(e.date)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 border-t border-ink-700 pt-3 text-xs text-slate-400">
                    {dias > 1 && (
                      <span>
                        <strong className="text-slate-200">{dias}</strong> dias
                      </span>
                    )}
                    <span>
                      <strong className="text-slate-200">{e._count.setlist}</strong> músicas
                    </span>
                    {openTasks > 0 && (
                      <span className="text-amber-400">{openTasks} pendências</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
