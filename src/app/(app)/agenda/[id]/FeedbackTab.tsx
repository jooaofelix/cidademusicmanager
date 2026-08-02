import { FEEDBACK_SECTORS, labelOf } from "@/lib/constants";
import { ProgressBar } from "@/components/ui";
import { saveFeedback } from "../actions";

type FeedbackRow = {
  id: string;
  sector: string;
  rating: number;
  comment: string | null;
  member: { id: string; name: string };
};

export function FeedbackTab({
  eventId,
  feedbacks,
  meId,
  eventDone,
}: {
  eventId: string;
  feedbacks: FeedbackRow[];
  meId: string;
  eventDone: boolean;
}) {
  const mine = new Map(feedbacks.filter((f) => f.member.id === meId).map((f) => [f.sector, f]));

  const bySector = FEEDBACK_SECTORS.map((s) => {
    const rows = feedbacks.filter((f) => f.sector === s.value && f.rating > 0);
    const avg = rows.length ? rows.reduce((a, f) => a + f.rating, 0) / rows.length : 0;
    return {
      ...s,
      avg,
      count: rows.length,
      comments: feedbacks.filter((f) => f.sector === s.value && f.comment),
    };
  });

  const rated = bySector.filter((s) => s.count > 0);
  const overall = rated.length ? rated.reduce((a, s) => a + s.avg, 0) / rated.length : 0;

  return (
    <div className="space-y-5">
      {!eventDone && (
        <p className="rounded-xl border tint-amber px-3 py-2.5 text-xs text-amber-200">
          Este evento ainda não foi marcado como <strong>Realizado</strong>. Você já pode registrar
          sua avaliação, mas o ideal é preencher depois que tudo acabar.
        </p>
      )}

      {rated.length > 0 && (
        <section className="card">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="section-title">Resultado da equipe</h3>
            <span className="text-lg font-bold text-brand-400">
              {overall.toFixed(1)}
              <span className="text-xs font-normal text-slate-500">/5</span>
            </span>
          </div>
          <ul className="space-y-3">
            {rated.map((s) => (
              <li key={s.value}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {s.avg.toFixed(1)}{" "}
                    <span className="text-xs text-slate-600">({s.count})</span>
                  </span>
                </div>
                <ProgressBar
                  value={(s.avg / 5) * 100}
                  tone={s.avg >= 4 ? "green" : "brand"}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedbacks.some((f) => f.comment) && (
        <section>
          <h3 className="section-title mb-2">Comentários</h3>
          <ul className="space-y-2">
            {feedbacks
              .filter((f) => f.comment)
              .map((f) => (
                <li key={f.id} className="card-tight">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {f.member.name.split(" ")[0]}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {labelOf(FEEDBACK_SECTORS, f.sector)}
                      {f.rating > 0 && ` · ${"★".repeat(f.rating)}`}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{f.comment}</p>
                </li>
              ))}
          </ul>
        </section>
      )}

      <form action={saveFeedback} className="space-y-3">
        <input type="hidden" name="eventId" value={eventId} />
        <h3 className="section-title">Sua avaliação</h3>
        <p className="text-xs text-slate-500">
          Dê nota de 1 a 5 nos setores que você quiser. Pode deixar em branco o que não se aplica.
        </p>

        {FEEDBACK_SECTORS.map((s) => {
          const existing = mine.get(s.value);
          return (
            <fieldset key={s.value} className="card-tight">
              <input type="hidden" name="sector" value={s.value} />
              <legend className="sr-only">{s.label}</legend>

              <div className="mb-2">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] text-slate-500">{s.hint}</p>
              </div>

              <div className="mb-2 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`rating_${s.value}`}
                      value={n}
                      defaultChecked={existing?.rating === n}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg border border-ink-600 bg-ink-900 py-2 text-center text-sm font-semibold text-slate-400 transition peer-checked:border-brand-500 peer-checked:bg-brand-600/25 peer-checked:text-brand-200">
                      {n}
                    </span>
                  </label>
                ))}
              </div>

              <input
                name={`comment_${s.value}`}
                defaultValue={existing?.comment ?? ""}
                placeholder="Comentário (opcional)"
                className="input py-2 text-sm"
              />
            </fieldset>
          );
        })}

        <button type="submit" className="btn-primary w-full py-3">
          Salvar minha avaliação
        </button>
      </form>
    </div>
  );
}
