import { Chip } from "@/components/ui";
import { INSTRUMENTS } from "@/lib/constants";
import { addToLineup, removeFromLineup, respondLineup } from "../actions";

type LineupRow = {
  id: string;
  instrument: string;
  status: string;
  note: string | null;
  member: { id: string; name: string; instrument: string };
};

export function LineupTab({
  eventId,
  lineups,
  members,
  meId,
  isAdmin,
}: {
  eventId: string;
  lineups: LineupRow[];
  members: { id: string; name: string; instrument: string }[];
  meId: string;
  isAdmin: boolean;
}) {
  // Agrupa por instrumento preservando a ordem canônica
  const groups = new Map<string, LineupRow[]>();
  for (const l of lineups) {
    const list = groups.get(l.instrument) ?? [];
    list.push(l);
    groups.set(l.instrument, list);
  }
  const ordered = [...groups.entries()].sort((a, b) => {
    const ia = INSTRUMENTS.indexOf(a[0] as (typeof INSTRUMENTS)[number]);
    const ib = INSTRUMENTS.indexOf(b[0] as (typeof INSTRUMENTS)[number]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const confirmed = lineups.filter((l) => l.status === "CONFIRMADO").length;
  const pending = lineups.filter((l) => l.status === "PENDENTE").length;

  return (
    <div className="space-y-4">
      <div className="card-tight flex items-center justify-between">
        <span className="text-sm text-slate-400">Confirmações</span>
        <span className="text-sm font-semibold">
          <span className="text-emerald-400">{confirmed}</span>
          <span className="text-slate-500"> de {lineups.length}</span>
          {pending > 0 && <span className="ml-2 text-amber-400">· {pending} pendente(s)</span>}
        </span>
      </div>

      {ordered.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
          Ninguém escalado ainda. Adicione os músicos abaixo.
        </p>
      )}

      {ordered.map(([instrument, rows]) => (
        <section key={instrument}>
          <h3 className="section-title mb-2">{instrument}</h3>
          <ul className="space-y-2">
            {rows.map((l) => {
              const isMe = l.member.id === meId;
              const canRespond = isMe || isAdmin;

              return (
                <li key={l.id} className="card-tight">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {l.member.name}
                        {isMe && <span className="ml-1.5 text-xs font-normal text-brand-400">(você)</span>}
                      </p>
                      {l.note && <p className="mt-0.5 text-xs text-slate-400">“{l.note}”</p>}
                    </div>
                    <StatusChip status={l.status} />
                  </div>

                  {canRespond && (
                    <div className="mt-2.5 flex gap-2">
                      <form action={respondLineup} className="flex-1">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="CONFIRMADO" />
                        <button
                          type="submit"
                          disabled={l.status === "CONFIRMADO"}
                          className="btn btn-sm w-full border tint-green hover:brightness-95 disabled:opacity-40"
                        >
                          ✓ Confirmo
                        </button>
                      </form>
                      <form action={respondLineup} className="flex-1">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="RECUSADO" />
                        <button
                          type="submit"
                          disabled={l.status === "RECUSADO"}
                          className="btn-danger btn-sm w-full disabled:opacity-40"
                        >
                          ✕ Não posso
                        </button>
                      </form>
                      {isAdmin && (
                        <form action={removeFromLineup}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="eventId" value={eventId} />
                          <button type="submit" aria-label="Remover" className="btn-ghost btn-sm">
                            🗑
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <form action={addToLineup} className="card space-y-3">
        <h3 className="section-title">Escalar integrante</h3>
        <div className="grid grid-cols-2 gap-2">
          <select name="memberId" required className="input" defaultValue="">
            <option value="" disabled>Integrante</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select name="instrument" required className="input" defaultValue="">
            <option value="" disabled>Função</option>
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="eventId" value={eventId} />
        <button type="submit" className="btn-ghost w-full">Adicionar à escala</button>
      </form>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === "CONFIRMADO") return <Chip tone="green">Confirmado</Chip>;
  if (status === "RECUSADO") return <Chip tone="red">Não pode</Chip>;
  return <Chip tone="amber">Pendente</Chip>;
}
