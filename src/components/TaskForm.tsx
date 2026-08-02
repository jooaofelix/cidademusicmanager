import { PRIORITIES, TASK_CATEGORIES } from "@/lib/constants";
import { createTask } from "@/app/(app)/checklist/actions";

export function TaskForm({
  members,
  eventId,
  defaultCategory = "GERAL",
}: {
  members: { id: string; name: string }[];
  eventId?: string;
  defaultCategory?: string;
}) {
  return (
    <form action={createTask} className="card space-y-3">
      <h3 className="section-title">Nova demanda</h3>
      {eventId && <input type="hidden" name="eventId" value={eventId} />}

      <input name="title" required placeholder="O que precisa ser feito?" className="input" />

      <div className="grid grid-cols-2 gap-2">
        <select name="category" defaultValue={defaultCategory} className="input">
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select name="priority" defaultValue="MEDIA" className="input">
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select name="assigneeId" defaultValue="" className="input">
          <option value="">Responsável</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input name="dueDate" type="date" className="input" title="Prazo" />
      </div>

      <button type="submit" className="btn-ghost w-full">Adicionar</button>
    </form>
  );
}
