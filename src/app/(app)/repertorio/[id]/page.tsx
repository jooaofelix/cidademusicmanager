import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader, Chip } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { toggleSongActive } from "../actions";

export const dynamic = "force-dynamic";

export default async function MusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const song = await db.song.findUnique({
    where: { id },
    include: {
      setlistItems: {
        orderBy: { event: { date: "desc" } },
        include: { event: { select: { id: true, title: true, date: true } } },
      },
    },
  });

  if (!song) notFound();

  const tags = (song.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <>
      <PageHeader
        title={song.title}
        subtitle={song.artist ?? undefined}
        back={{ href: "/repertorio" }}
        action={
          <Link href={`/repertorio/${song.id}/editar`} className="btn-ghost btn-sm shrink-0">
            Editar
          </Link>
        }
      />

      <div className="card mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Tom</p>
            <p className="mt-0.5 text-xl font-bold text-brand-400">{song.defaultKey ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">BPM</p>
            <p className="mt-0.5 text-xl font-bold">{song.bpm ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Compasso</p>
            <p className="mt-0.5 text-xl font-bold">{song.timeSig ?? "—"}</p>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-700 pt-3">
            {tags.map((t) => <Chip key={t}>{t}</Chip>)}
          </div>
        )}
      </div>

      <div className="mb-4 grid gap-2">
        {song.versionUrl && (
          <a href={song.versionUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-start">
            ▶ Ouvir a versão que tocamos
          </a>
        )}
        {song.vsUrl && (
          <a href={song.vsUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-start">
            🎛 Baixar o VS / multitrack
          </a>
        )}
        {song.chartUrl && (
          <a href={song.chartUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-start">
            🎼 Abrir cifra
          </a>
        )}
        {!song.versionUrl && !song.vsUrl && !song.chartUrl && (
          <p className="rounded-xl border border-dashed border-ink-600 px-4 py-4 text-center text-sm text-slate-500">
            Nenhum link cadastrado ainda.
          </p>
        )}
      </div>

      {song.notes && (
        <section className="card mb-4">
          <h3 className="section-title mb-2">Observações da banda</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-300">{song.notes}</p>
        </section>
      )}

      {song.lyrics && (
        <details className="card mb-4">
          <summary className="cursor-pointer text-sm font-semibold">Letra</summary>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300">
            {song.lyrics}
          </pre>
        </details>
      )}

      <section className="mb-4">
        <h3 className="section-title mb-2">
          Histórico — tocada {song.setlistItems.length}×
        </h3>
        {song.setlistItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-600 px-4 py-4 text-center text-sm text-slate-500">
            Ainda não entrou em nenhuma Ordem de Culto.
          </p>
        ) : (
          <ul className="space-y-2">
            {song.setlistItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/agenda/${item.event.id}?tab=oc`}
                  className="card-tight flex items-center justify-between gap-3 transition hover:border-ink-600"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.event.title}</p>
                    <p className="text-xs text-slate-500">{fmtDate(item.event.date)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {item.keyUsed && <Chip tone="blue">{item.keyUsed}</Chip>}
                    {item.bpmUsed && <Chip>{item.bpmUsed}</Chip>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={toggleSongActive}>
        <input type="hidden" name="id" value={song.id} />
        <button type="submit" className="btn-ghost w-full">
          {song.active ? "Arquivar música" : "Reativar música"}
        </button>
      </form>
    </>
  );
}
