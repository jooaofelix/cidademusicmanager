import { db } from "@/lib/db";
import { PageHeader, EmptyState, ProgressBar, Tabs, Chip } from "@/components/ui";
import { brl, fmtDate, toInputDate } from "@/lib/format";
import {
  contributeToProject,
  createProject,
  deleteProject,
  updateProject,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ProjetosPage() {
  const projects = await db.project.findMany({
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: { transactions: { select: { amountCents: true, type: true } } },
  });

  return (
    <>
      <PageHeader
        title="Projetos e sonhos"
        subtitle="Quanto falta para cada meta da banda"
        back={{ href: "/financas" }}
      />

      <Tabs
        current="/financas/projetos"
        items={[
          { href: "/financas", label: "Dashboard" },
          { href: "/financas/lancamentos", label: "Lançamentos" },
          { href: "/financas/projetos", label: "Projetos" },
          { href: "/financas/streaming", label: "Streaming" },
        ]}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto cadastrado"
          description="Ex: comprar in-ear novo, gravar um DVD, fazer uma viagem missionária."
        />
      ) : (
        <ul className="mb-5 space-y-3">
          {projects.map((p) => {
            const saved = p.transactions
              .filter((t) => t.type === "ENTRADA")
              .reduce((a, t) => a + t.amountCents, 0);
            const spent = p.transactions
              .filter((t) => t.type === "SAIDA")
              .reduce((a, t) => a + t.amountCents, 0);
            const pct = p.targetCents > 0 ? (saved / p.targetCents) * 100 : 0;
            const missing = Math.max(0, p.targetCents - saved);

            return (
              <li key={p.id} className="card">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{p.name}</h2>
                    {p.description && (
                      <p className="mt-0.5 text-xs text-slate-400">{p.description}</p>
                    )}
                  </div>
                  <Chip tone={p.status === "CONCLUIDO" ? "green" : p.status === "PAUSADO" ? "slate" : "blue"}>
                    {p.status === "CONCLUIDO" ? "Concluído" : p.status === "PAUSADO" ? "Pausado" : "Ativo"}
                  </Chip>
                </div>

                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-bold tabular-nums text-emerald-400">{brl(saved)}</span>
                  <span className="text-xs tabular-nums text-slate-400">meta {brl(p.targetCents)}</span>
                </div>
                <ProgressBar value={pct} tone={pct >= 100 ? "green" : "brand"} />

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{Math.round(pct)}% da meta</span>
                  <span>Faltam {brl(missing)}</span>
                  {spent > 0 && <span>Já gasto: {brl(spent)}</span>}
                  {p.deadline && <span>Prazo: {fmtDate(p.deadline)}</span>}
                </div>

                <form action={contributeToProject} className="mt-3 flex gap-2 border-t border-ink-700 pt-3">
                  <input type="hidden" name="projectId" value={p.id} />
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    placeholder="Guardar R$…"
                    className="input py-2 text-sm"
                  />
                  <button type="submit" className="btn-primary btn-sm shrink-0">Reservar</button>
                </form>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-500">Editar projeto</summary>
                  <form action={updateProject} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input name="name" defaultValue={p.name} className="input py-2 text-sm" />
                    <input
                      name="description"
                      defaultValue={p.description ?? ""}
                      placeholder="Descrição"
                      className="input py-2 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="targetAmount"
                        inputMode="decimal"
                        defaultValue={(p.targetCents / 100).toFixed(2).replace(".", ",")}
                        className="input py-2 text-sm"
                      />
                      <input
                        name="deadline"
                        type="date"
                        defaultValue={toInputDate(p.deadline)}
                        className="input py-2 text-sm"
                      />
                    </div>
                    <select name="status" defaultValue={p.status} className="input py-2 text-sm">
                      <option value="ATIVO">Ativo</option>
                      <option value="PAUSADO">Pausado</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                    <button type="submit" className="btn-primary btn-sm w-full">Salvar</button>
                  </form>
                  <form action={deleteProject} className="mt-2">
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="btn-danger btn-sm w-full">Excluir projeto</button>
                  </form>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      <form action={createProject} className="card space-y-3">
        <h3 className="section-title">Novo projeto / sonho</h3>
        <input name="name" required placeholder="Ex: Gravar EP ao vivo" className="input" />
        <input name="description" placeholder="O que é e por quê" className="input" />
        <div className="grid grid-cols-2 gap-2">
          <input name="targetAmount" inputMode="decimal" required placeholder="Meta R$" className="input" />
          <input name="deadline" type="date" className="input" title="Prazo" />
        </div>
        <button type="submit" className="btn-primary w-full">Criar projeto</button>
      </form>
    </>
  );
}
