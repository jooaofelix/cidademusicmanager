import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Chip } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RepertorioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const termo = (q ?? "").trim();

  const songs = await db.song.findMany({
    where: {
      active: true,
      ...(termo
        ? {
            OR: [
              { title: { contains: termo } },
              { artist: { contains: termo } },
              { tags: { contains: termo } },
            ],
          }
        : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { title: "asc" },
    include: {
      setlistItems: {
        orderBy: { event: { date: "desc" } },
        take: 1,
        include: { event: { select: { date: true, title: true } } },
      },
      _count: { select: { setlistItems: true } },
    },
  });

  const allTags = new Set<string>();
  const allSongs = await db.song.findMany({ where: { active: true }, select: { tags: true } });
  for (const s of allSongs) {
    for (const t of (s.tags ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      allTags.add(t);
    }
  }

  return (
    <>
      <PageHeader
        title="Repertório"
        subtitle="Tons, BPM, versões e VS de cada música"
        action={
          <Link href="/repertorio/nova" className="btn-primary btn-sm shrink-0">
            + Música
          </Link>
        }
      />

      <form className="mb-3">
        <input
          name="q"
          defaultValue={termo}
          placeholder="Buscar por nome, artista ou tag…"
          className="input"
        />
      </form>

      {allTags.size > 0 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <Link
            href="/repertorio"
            className={`chip shrink-0 ${!tag ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
          >
            Todas
          </Link>
          {[...allTags].sort().map((t) => (
            <Link
              key={t}
              href={`/repertorio?tag=${encodeURIComponent(t)}`}
              className={`chip shrink-0 ${tag === t ? "border-brand-500 bg-brand-600/20 text-brand-200" : "border-ink-700 bg-ink-850 text-slate-400"}`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
        <span>{songs.length} música(s)</span>
        <Link href="/repertorio/ocs" className="text-brand-400 underline underline-offset-2">
          Ver OCs anteriores →
        </Link>
      </div>

      {songs.length === 0 ? (
        <EmptyState
          title="Nenhuma música encontrada"
          description="Cadastre as músicas com tom, BPM, link da versão e o VS."
          action={
            <Link href="/repertorio/nova" className="btn-primary">
              Cadastrar música
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {songs.map((s) => {
            const last = s.setlistItems[0]?.event;
            return (
              <li key={s.id}>
                <Link href={`/repertorio/${s.id}`} className="card-tight block transition hover:border-ink-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{s.title}</p>
                      {s.artist && <p className="truncate text-xs text-slate-500">{s.artist}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.defaultKey && <Chip tone="blue">Tom {s.defaultKey}</Chip>}
                        {s.bpm && <Chip>{s.bpm} BPM</Chip>}
                        {s.vsUrl && <Chip tone="purple">VS</Chip>}
                        {s.chartUrl && <Chip>Cifra</Chip>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-slate-500">{s._count.setlistItems}× tocada</p>
                      {last && (
                        <p className="mt-0.5 text-[11px] text-slate-600">{fmtDate(last.date)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
