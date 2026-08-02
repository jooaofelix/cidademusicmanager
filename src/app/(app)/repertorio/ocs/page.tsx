import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader, EmptyState, Chip } from "@/components/ui";
import { fmtDateLong } from "@/lib/format";
import { EVENT_TYPES, labelOf } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function OCsPage() {
  const events = await db.event.findMany({
    where: { setlist: { some: {} } },
    orderBy: { date: "desc" },
    take: 60,
    include: {
      setlist: {
        orderBy: { position: "asc" },
        include: {
          song: { select: { id: true, title: true, artist: true, versionUrl: true, vsUrl: true } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Ordens de Culto"
        subtitle="Tudo que já tocamos, com tom e BPM de cada dia"
        back={{ href: "/repertorio" }}
      />

      {events.length === 0 ? (
        <EmptyState
          title="Nenhuma OC montada ainda"
          description="Monte a Ordem de Culto dentro de cada evento na aba Agenda."
        />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="card">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/agenda/${e.id}?tab=oc`} className="truncate font-semibold hover:text-brand-300">
                    {e.title}
                  </Link>
                  <p className="text-xs text-slate-500">{fmtDateLong(e.date)}</p>
                </div>
                <Chip tone="blue">{labelOf(EVENT_TYPES, e.type)}</Chip>
              </div>

              <ol className="space-y-1.5">
                {e.setlist.map((item, i) => (
                  <li key={item.id} className="flex items-baseline gap-2 text-sm">
                    <span className="w-4 shrink-0 text-right text-xs text-slate-600">{i + 1}.</span>
                    <span className="min-w-0 flex-1">
                      {item.song ? (
                        <Link href={`/repertorio/${item.song.id}`} className="hover:text-brand-300">
                          {item.song.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400">{item.label}</span>
                      )}
                      {item.moment && (
                        <span className="ml-1.5 text-xs text-purple-400">· {item.moment}</span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs text-slate-500">
                      {item.keyUsed ?? "—"}
                      {item.bpmUsed ? ` · ${item.bpmUsed}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
