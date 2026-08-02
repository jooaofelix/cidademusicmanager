import { db } from "@/lib/db";
import { PageHeader, EmptyState, Chip } from "@/components/ui";
import { PRIORITIES, TASK_CATEGORIES, labelOf } from "@/lib/constants";
import {
  addTemplateItem,
  createTemplate,
  deleteTemplate,
  deleteTemplateItem,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ModelosPage() {
  const templates = await db.checklistTemplate.findMany({
    orderBy: { name: "asc" },
    include: { items: { orderBy: { position: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Modelos de checklist"
        subtitle="Listas padrão que você aplica em qualquer evento com um toque"
        back={{ href: "/checklist" }}
      />

      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum modelo criado"
          description="Crie um modelo (ex: “Culto padrão”) com os itens que se repetem sempre."
        />
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id} className="card">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="text-xs text-slate-500">{t.items.length} itens</span>
              </div>

              {t.items.length > 0 && (
                <ul className="mb-3 space-y-1.5">
                  {t.items.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-2 rounded-lg bg-ink-900 px-2.5 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{i.title}</p>
                        <div className="mt-1 flex gap-1.5">
                          <Chip>{labelOf(TASK_CATEGORIES, i.category)}</Chip>
                          <Chip tone={i.priority === "ALTA" ? "red" : "slate"}>
                            {labelOf(PRIORITIES, i.priority)}
                          </Chip>
                        </div>
                      </div>
                      <form action={deleteTemplateItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <button type="submit" aria-label="Remover item" className="btn-ghost btn-sm">🗑</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}

              <form action={addTemplateItem} className="space-y-2 border-t border-ink-700 pt-3">
                <input type="hidden" name="templateId" value={t.id} />
                <input name="title" required placeholder="Novo item do modelo" className="input py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="category" defaultValue="LOGISTICA" className="input py-2 text-sm">
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <select name="priority" defaultValue="MEDIA" className="input py-2 text-sm">
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-ghost btn-sm w-full">Adicionar item</button>
              </form>

              <form action={deleteTemplate} className="mt-2">
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="btn-danger btn-sm w-full">Excluir modelo</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={createTemplate} className="card mt-5 space-y-3">
        <h3 className="section-title">Novo modelo</h3>
        <input name="name" required placeholder="Ex: Culto padrão, Viagem, Gravação" className="input" />
        <button type="submit" className="btn-primary w-full">Criar modelo</button>
      </form>
    </>
  );
}
