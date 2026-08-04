import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { EVENT_STATUS, EVENT_TYPES } from "@/lib/constants";
import { toInputDate } from "@/lib/format";
import { deleteEvent, updateEvent } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireMember();
  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <>
      <PageHeader title="Editar evento" back={{ href: `/agenda/${event.id}` }} />

      <form action={updateEvent} className="space-y-4">
        <input type="hidden" name="id" value={event.id} />

        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="title">Título *</label>
            <input id="title" name="title" required defaultValue={event.title} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="type">Tipo</label>
              <select id="type" name="type" defaultValue={event.type} className="input">
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={event.status} className="input">
                {EVENT_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">Começa em *</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={toInputDate(event.date)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="endDate">Termina em</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={toInputDate(event.endDate)}
                className="input"
              />
            </div>
          </div>
          <p className="-mt-1 text-xs text-slate-500">
            Deixe o término vazio se tudo acontece no mesmo dia.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="callTime">Chegada</label>
              <input id="callTime" name="callTime" type="time" defaultValue={event.callTime ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="startTime">Início</label>
              <input id="startTime" name="startTime" type="time" defaultValue={event.startTime ?? ""} className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="location">Local</label>
            <input id="location" name="location" defaultValue={event.location ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="address">Endereço</label>
            <input id="address" name="address" defaultValue={event.address ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="driveUrl">Pasta no Google Drive</label>
            <input id="driveUrl" name="driveUrl" type="url" defaultValue={event.driveUrl ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} defaultValue={event.notes ?? ""} className="input" />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3">Salvar alterações</button>
      </form>

      {me.isAdmin && (
        <form action={deleteEvent} className="mt-6">
          <input type="hidden" name="id" value={event.id} />
          <button type="submit" className="btn-danger w-full">
            Excluir evento
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            Apaga escala, OC, checklist e feedbacks deste evento. Os lançamentos financeiros
            continuam no caixa, sem vínculo com o evento.
          </p>
        </form>
      )}
    </>
  );
}
