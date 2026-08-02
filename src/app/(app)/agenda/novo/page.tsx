import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { EVENT_TYPES } from "@/lib/constants";
import { createEvent } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoEventoPage() {
  const templates = await db.checklistTemplate.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <>
      <PageHeader title="Novo evento" back={{ href: "/agenda" }} />

      <form action={createEvent} className="space-y-4">
        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="title">Título *</label>
            <input id="title" name="title" required className="input" placeholder="Culto de domingo à noite" />
          </div>

          <div>
            <label className="label" htmlFor="type">Tipo</label>
            <select id="type" name="type" className="input">
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="date">Data *</label>
            <input id="date" name="date" type="date" required className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="callTime">Chegada da equipe</label>
              <input id="callTime" name="callTime" type="time" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="startTime">Início</label>
              <input id="startTime" name="startTime" type="time" className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="location">Local</label>
            <input id="location" name="location" className="input" placeholder="Igreja Sede" />
          </div>
          <div>
            <label className="label" htmlFor="address">Endereço</label>
            <input id="address" name="address" className="input" placeholder="Rua, número, bairro" />
          </div>
          <div>
            <label className="label" htmlFor="driveUrl">Pasta no Google Drive</label>
            <input id="driveUrl" name="driveUrl" type="url" className="input" placeholder="https://drive.google.com/..." />
            <p className="mt-1 text-xs text-slate-500">
              Opcional — pasta com VS, cifras e materiais deste evento.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} className="input" placeholder="Detalhes importantes, contato do local..." />
          </div>
        </div>

        {templates.length > 0 && (
          <div className="card">
            <label className="label" htmlFor="templateId">Aplicar modelo de checklist</label>
            <select id="templateId" name="templateId" className="input">
              <option value="">Nenhum</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t._count.items} itens)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Cria automaticamente as tarefas padrão deste tipo de evento.
            </p>
          </div>
        )}

        <button type="submit" className="btn-primary w-full py-3">Criar evento</button>
      </form>
    </>
  );
}
