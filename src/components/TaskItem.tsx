import { Chip } from "@/components/ui";
import { PRIORITIES, TASK_CATEGORIES, labelOf } from "@/lib/constants";
import { fmtDate } from "@/lib/format";
import { deleteTask, toggleTask, updateTask } from "@/app/(app)/checklist/actions";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  done: boolean;
  dueDate: Date | null;
  assignee: { id: string; name: string } | null;
  event?: { id: string; title: string } | null;
};

const PRIORITY_TONE = { ALTA: "red", MEDIA: "amber", BAIXA: "slate" } as const;

export function TaskItem({
  task,
  members,
  showEvent = false,
}: {
  task: TaskRow;
  members: { id: string; name: string }[];
  showEvent?: boolean;
}) {
  const overdue = !task.done && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <li className={`card-tight ${task.done ? "opacity-55" : ""}`}>
      <div className="flex items-start gap-3">
        <form action={toggleTask} className="shrink-0 pt-0.5">
          <input type="hidden" name="id" value={task.id} />
          <button
            type="submit"
            aria-label={task.done ? "Reabrir" : "Concluir"}
            className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
              task.done
                ? "border-emerald-500 bg-emerald-500 text-ink-950"
                : "border-ink-600 hover:border-brand-500"
            }`}
          >
            {task.done && (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug ${task.done ? "line-through" : ""}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 text-xs text-slate-400">{task.description}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Chip tone={PRIORITY_TONE[task.priority as keyof typeof PRIORITY_TONE] ?? "slate"}>
              {labelOf(PRIORITIES, task.priority)}
            </Chip>
            <Chip>{labelOf(TASK_CATEGORIES, task.category)}</Chip>
            {task.assignee && <Chip tone="blue">{task.assignee.name.split(" ")[0]}</Chip>}
            {task.dueDate && (
              <Chip tone={overdue ? "red" : "slate"}>
                {overdue ? "Atrasada · " : ""}
                {fmtDate(task.dueDate)}
              </Chip>
            )}
            {showEvent && task.event && <Chip tone="purple">{task.event.title}</Chip>}
          </div>
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-slate-500">Editar</summary>
        <form action={updateTask} className="mt-2 space-y-2">
          <input type="hidden" name="id" value={task.id} />
          <input name="title" defaultValue={task.title} className="input py-2 text-sm" />
          <input
            name="description"
            defaultValue={task.description ?? ""}
            placeholder="Detalhes"
            className="input py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <select name="category" defaultValue={task.category} className="input py-2 text-sm">
              {TASK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select name="priority" defaultValue={task.priority} className="input py-2 text-sm">
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="assigneeId" defaultValue={task.assignee?.id ?? ""} className="input py-2 text-sm">
              <option value="">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input
              name="dueDate"
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              className="input py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary btn-sm w-full">Salvar</button>
        </form>
        <form action={deleteTask} className="mt-2">
          <input type="hidden" name="id" value={task.id} />
          <button type="submit" className="btn-danger btn-sm w-full">Excluir</button>
        </form>
      </details>
    </li>
  );
}
