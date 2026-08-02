import { Chip } from "@/components/ui";
import { KEYS, MOMENTS } from "@/lib/constants";
import { addSetlistItem, moveSetlistItem, removeSetlistItem, updateSetlistItem } from "../actions";

type Item = {
  id: string;
  position: number;
  keyUsed: string | null;
  bpmUsed: number | null;
  moment: string | null;
  notes: string | null;
  label: string | null;
  song: {
    id: string;
    title: string;
    artist: string | null;
    defaultKey: string | null;
    bpm: number | null;
    versionUrl: string | null;
    vsUrl: string | null;
    chartUrl: string | null;
  } | null;
};

export function SetlistTab({
  eventId,
  items,
  songs,
}: {
  eventId: string;
  items: Item[];
  songs: { id: string; title: string; artist: string | null }[];
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-sm text-slate-500">
          A Ordem de Culto está vazia. Adicione músicas ou blocos abaixo.
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="card-tight">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-xs font-bold text-slate-300">
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1">
                  {item.song ? (
                    <>
                      <p className="text-sm font-semibold leading-tight">{item.song.title}</p>
                      {item.song.artist && (
                        <p className="text-xs text-slate-500">{item.song.artist}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-semibold leading-tight text-slate-300">
                      {item.label}
                    </p>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {item.moment && <Chip tone="purple">{item.moment}</Chip>}
                    {item.keyUsed && <Chip tone="blue">Tom {item.keyUsed}</Chip>}
                    {item.bpmUsed && <Chip>{item.bpmUsed} BPM</Chip>}
                  </div>

                  {item.notes && <p className="mt-1.5 text-xs text-slate-400">{item.notes}</p>}

                  {item.song && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {item.song.versionUrl && (
                        <a href={item.song.versionUrl} target="_blank" rel="noreferrer" className="text-brand-400 underline underline-offset-2">
                          ▶ Versão
                        </a>
                      )}
                      {item.song.vsUrl && (
                        <a href={item.song.vsUrl} target="_blank" rel="noreferrer" className="text-brand-400 underline underline-offset-2">
                          🎛 VS
                        </a>
                      )}
                      {item.song.chartUrl && (
                        <a href={item.song.chartUrl} target="_blank" rel="noreferrer" className="text-brand-400 underline underline-offset-2">
                          🎼 Cifra
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <form action={moveSetlistItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="dir" value="up" />
                    <button type="submit" disabled={idx === 0} aria-label="Subir" className="btn-ghost btn-sm disabled:opacity-30">↑</button>
                  </form>
                  <form action={moveSetlistItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="dir" value="down" />
                    <button type="submit" disabled={idx === items.length - 1} aria-label="Descer" className="btn-ghost btn-sm disabled:opacity-30">↓</button>
                  </form>
                </div>
              </div>

              <details className="mt-2 border-t border-ink-700 pt-2">
                <summary className="cursor-pointer text-xs text-slate-500">Ajustar tom / BPM / observação</summary>
                <form action={updateSetlistItem} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <div className="grid grid-cols-3 gap-2">
                    <select name="keyUsed" defaultValue={item.keyUsed ?? ""} className="input py-2 text-sm">
                      <option value="">Tom</option>
                      {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input name="bpmUsed" type="number" inputMode="numeric" placeholder="BPM" defaultValue={item.bpmUsed ?? ""} className="input py-2 text-sm" />
                    <select name="moment" defaultValue={item.moment ?? ""} className="input py-2 text-sm">
                      <option value="">Momento</option>
                      {MOMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <input name="notes" placeholder="Observação (ex: entrada só voz)" defaultValue={item.notes ?? ""} className="input py-2 text-sm" />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary btn-sm flex-1">Salvar</button>
                  </div>
                </form>
                <form action={removeSetlistItem} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="eventId" value={eventId} />
                  <button type="submit" className="btn-danger btn-sm w-full">Remover da OC</button>
                </form>
              </details>
            </li>
          ))}
        </ol>
      )}

      <form action={addSetlistItem} className="card space-y-3">
        <h3 className="section-title">Adicionar à OC</h3>
        <select name="songId" className="input" defaultValue="">
          <option value="">— Escolher música do repertório —</option>
          {songs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}{s.artist ? ` · ${s.artist}` : ""}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select name="moment" className="input" defaultValue="">
            <option value="">Momento</option>
            {MOMENTS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input name="label" placeholder="Ou bloco livre (Palavra…)" className="input" />
        </div>

        <input type="hidden" name="eventId" value={eventId} />
        <button type="submit" className="btn-ghost w-full">Adicionar</button>
        <p className="text-xs text-slate-500">
          O tom e o BPM vêm do cadastro da música e podem ser ajustados só para este evento.
        </p>
      </form>
    </div>
  );
}
