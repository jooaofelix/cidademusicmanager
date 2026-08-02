import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { PageHeader, EmptyState, Tabs } from "@/components/ui";
import { TaskItem } from "@/components/TaskItem";
import { TaskForm } from "@/components/TaskForm";
import { TASK_CATEGORIES, labelOf } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; cat?: string }>;
}) {
  const { ver, cat } = await searchParams;
  const me = await getCurrentMember();
  const view = ver ?? "abertas";

  const where = {
    ...(view === "minhas" ? { assigneeId: me?.id } : {}),
    ...(view === "concluidas" ? { done: true } : { done: false }),
    ...(cat ? { category: cat } : {}),
  };

  const tasks = await db.task.findMany({
    where,
    orderBy: [
      { done: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: 200,
    include: {
      assignee: { select: { id: true, name: true } },
      event: { select: { id: true, title: true } },
    },
  });

  const members = await db.member.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Agrupa por categoria
  const groups = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const list = groups.get(t.category) ?? [];
    list.push(t);
    groups.set(t.category, list);
  }
  const ordered = TASK_CATEGORIES.map((c) => [c.value, groups.get(c.value) ?? []] as const).filter(
    ([, list]) => list.length > 0
  );

  const base = (v: string) => `/checklist?ver=${v}${cat ? `&cat=${cat}` : ""}`;

  return (
    <>
      <PageHeader
        title="Checklist"
        subtitle="Demandas de logística, culto e administrativo"
        action={
          <Link href="/checklist/modelos" className="btn-ghost btn-sm shrink-0">
            Modelos
          </Link>
        }
      />

      <Tabs
        current={base(view)}
        items={[
          { href: base("abertas"), label: "Abertas" },
          { href: base("minhas"), label: "Minhas" },
          { href: base("concluidas"), label: "Concluídas" },
        ]}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <Link
          href={`/checklist?ver=${view}`}
          className={`chip shrink-0 ${!cat ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
        >
          Todas
        </Link>
        {TASK_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/checklist?ver=${view}&cat=${c.value}`}
            className={`chip shrink-0 ${cat === c.value ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title={view === "concluidas" ? "Nada concluído ainda" : "Tudo em dia! 🎉"}
          description={
            view === "minhas"
              ? "Nenhuma demanda está atribuída a você no momento."
              : "Nenhuma pendência aberta com esse filtro."
          }
        />
      ) : (
        <div className="space-y-5">
          {ordered.map(([category, list]) => (
            <section key={category}>
              <h2 className="section-title mb-2">
                {labelOf(TASK_CATEGORIES, category)}
                <span className="ml-1.5 text-slate-600">({list.length})</span>
              </h2>
              <ul className="space-y-2">
                {list.map((t) => (
                  <TaskItem key={t.id} task={t} members={members} showEvent />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-5">
        <TaskForm members={members} />
      </div>
    </>
  );
}
