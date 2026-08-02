import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { PageHeader, Chip } from "@/components/ui";
import { TaskItem } from "@/components/TaskItem";
import { TaskForm } from "@/components/TaskForm";
import { fmtDateLong, relativeDay } from "@/lib/format";
import { EVENT_STATUS, EVENT_TYPES, labelOf } from "@/lib/constants";
import { applyTemplateAction, setEventStatus } from "../actions";
import { LineupTab } from "./LineupTab";
import { SetlistTab } from "./SetlistTab";
import { FeedbackTab } from "./FeedbackTab";
import { MoneyTab } from "./MoneyTab";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "escala", label: "Escala" },
  { id: "oc", label: "Ordem de Culto" },
  { id: "checklist", label: "Checklist" },
  { id: "financeiro", label: "Financeiro" },
  { id: "feedback", label: "Feedback" },
];

export default async function EventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const current = TABS.some((t) => t.id === tab) ? tab! : "escala";
  const me = await requireMember();

  const event = await db.event.findUnique({
    where: { id },
    include: {
      lineups: {
        include: { member: { select: { id: true, name: true, instrument: true } } },
        orderBy: { instrument: "asc" },
      },
      setlist: {
        orderBy: { position: "asc" },
        include: { song: true },
      },
      tasks: {
        orderBy: [{ done: "asc" }, { position: "asc" }],
        include: { assignee: { select: { id: true, name: true } } },
      },
      transactions: { orderBy: { createdAt: "desc" } },
      feedbacks: {
        include: { member: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  const [members, songs, templates] = await Promise.all([
    db.member.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, instrument: true },
    }),
    db.song.findMany({
      where: { active: true },
      orderBy: { title: "asc" },
      select: { id: true, title: true, artist: true },
    }),
    db.checklistTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  const myLineup = event.lineups.filter((l) => l.member.id === me.id);
  const openTasks = event.tasks.filter((t) => !t.done).length;
  const pendingOks = event.lineups.filter((l) => l.status === "PENDENTE").length;

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`${fmtDateLong(event.date)}${event.startTime ? ` · ${event.startTime}` : ""}`}
        back={{ href: "/agenda" }}
        action={
          <Link href={`/agenda/${event.id}/editar`} className="btn-ghost btn-sm shrink-0">
            Editar
          </Link>
        }
      />

      <div className="card mb-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="blue">{labelOf(EVENT_TYPES, event.type)}</Chip>
          <Chip tone={event.status === "REALIZADO" ? "green" : event.status === "CANCELADO" ? "red" : "slate"}>
            {labelOf(EVENT_STATUS, event.status)}
          </Chip>
          <Chip>{relativeDay(event.date)}</Chip>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {event.callTime && (
            <div>
              <dt className="text-xs text-slate-500">Chegada</dt>
              <dd className="font-medium">{event.callTime}</dd>
            </div>
          )}
          {event.startTime && (
            <div>
              <dt className="text-xs text-slate-500">Início</dt>
              <dd className="font-medium">{event.startTime}</dd>
            </div>
          )}
          {event.location && (
            <div className="col-span-2">
              <dt className="text-xs text-slate-500">Local</dt>
              <dd className="font-medium">{event.location}</dd>
              {event.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-400 underline underline-offset-2"
                >
                  {event.address} · abrir no mapa
                </a>
              )}
            </div>
          )}
        </dl>

        {event.notes && <p className="text-sm text-slate-300">{event.notes}</p>}

        {event.driveUrl && (
          <a href={event.driveUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full">
            📂 Materiais no Google Drive
          </a>
        )}

        {myLineup.length > 0 && (
          <div className="rounded-xl border tint-blue px-3 py-2.5">
            <p className="text-xs text-brand-200">
              Você está escalado em{" "}
              <strong>{myLineup.map((l) => l.instrument).join(", ")}</strong>
              {myLineup.some((l) => l.status === "PENDENTE") && " — confirme sua presença na aba Escala."}
            </p>
          </div>
        )}

        <form action={setEventStatus} className="flex gap-2">
          <input type="hidden" name="id" value={event.id} />
          <select name="status" defaultValue={event.status} className="input py-2 text-sm">
            {EVENT_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-ghost btn-sm shrink-0">Atualizar</button>
        </form>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const active = current === t.id;
          const badge =
            t.id === "checklist" && openTasks > 0
              ? openTasks
              : t.id === "escala" && pendingOks > 0
                ? pendingOks
                : null;

          return (
            <Link
              key={t.id}
              href={`/agenda/${event.id}?tab=${t.id}`}
              scroll={false}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-brand-500 bg-brand-600/20 text-brand-200"
                  : "border-ink-700 bg-ink-850 text-slate-400"
              }`}
            >
              {t.label}
              {badge !== null && (
                <span className="ml-1.5 rounded-full bg-amber-500/25 px-1.5 text-[10px] font-bold text-amber-300">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {current === "escala" && (
        <LineupTab
          eventId={event.id}
          lineups={event.lineups}
          members={members}
          meId={me.id}
          isAdmin={me.isAdmin}
        />
      )}

      {current === "oc" && (
        <SetlistTab eventId={event.id} items={event.setlist} songs={songs} />
      )}

      {current === "checklist" && (
        <div className="space-y-4">
          {event.tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
              Nenhuma demanda para este evento ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {event.tasks.map((t) => (
                <TaskItem key={t.id} task={t} members={members} />
              ))}
            </ul>
          )}

          <TaskForm members={members} eventId={event.id} defaultCategory="LOGISTICA" />

          {templates.length > 0 && (
            <form action={applyTemplateAction} className="card space-y-3">
              <h3 className="section-title">Aplicar modelo de checklist</h3>
              <input type="hidden" name="eventId" value={event.id} />
              <select name="templateId" required className="input" defaultValue="">
                <option value="" disabled>Escolha um modelo</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <button type="submit" className="btn-ghost w-full">Adicionar itens do modelo</button>
            </form>
          )}
        </div>
      )}

      {current === "financeiro" && (
        <MoneyTab eventId={event.id} transactions={event.transactions} />
      )}

      {current === "feedback" && (
        <FeedbackTab
          eventId={event.id}
          feedbacks={event.feedbacks}
          meId={me.id}
          eventDone={event.status === "REALIZADO"}
        />
      )}
    </>
  );
}
