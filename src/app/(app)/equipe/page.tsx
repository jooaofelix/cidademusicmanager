import { db } from "@/lib/db";
import { requireMember } from "@/lib/session";
import { PageHeader, Chip } from "@/components/ui";
import { INSTRUMENTS } from "@/lib/constants";
import { changePin, createMember, updateMember, updateTreasurer } from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const me = await requireMember();

  const members = await db.member.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { lineups: true, tasks: true } },
    },
  });

  return (
    <>
      <PageHeader title="Equipe" subtitle="Integrantes, funções e acesso" />

      <ul className="space-y-2">
        {members.map((m) => {
          const isMe = m.id === me.id;
          const canEdit = isMe || me.isAdmin;
          // Tesoureiro precisa alcançar todo mundo para passar o acesso adiante.
          const canGrantFinance = me.isTreasurer;

          return (
            <li key={m.id} className={`card-tight ${m.active ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {m.name}
                    {isMe && <span className="ml-1.5 text-xs font-normal text-brand-400">(você)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{m.instrument}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {m.isAdmin && <Chip tone="blue">Admin</Chip>}
                    {m.isTreasurer && <Chip tone="green">Finanças</Chip>}
                    {!m.active && <Chip tone="red">Inativo</Chip>}
                    <Chip>{m._count.lineups} escalas</Chip>
                    {m._count.tasks > 0 && <Chip tone="amber">{m._count.tasks} demandas</Chip>}
                  </div>
                </div>
                {m.phone && (
                  <a
                    href={`https://wa.me/55${m.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-sm shrink-0"
                  >
                    WhatsApp
                  </a>
                )}
              </div>

              {(canEdit || canGrantFinance) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-slate-500">
                    {isMe ? "Meus dados e PIN" : canEdit ? "Editar" : "Acesso às finanças"}
                  </summary>

                  {canEdit && (
                  <form action={updateMember} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input name="name" defaultValue={m.name} className="input py-2 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <select name="instrument" defaultValue={m.instrument} className="input py-2 text-sm">
                        {INSTRUMENTS.map((i) => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                      <input
                        name="phone"
                        defaultValue={m.phone ?? ""}
                        placeholder="WhatsApp (DDD+num)"
                        className="input py-2 text-sm"
                      />
                    </div>

                    {me.isAdmin && (
                      <div className="flex gap-4 px-1 py-1">
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            name="isAdmin"
                            defaultChecked={m.isAdmin}
                            className="h-4 w-4 accent-brand-500"
                          />
                          Administrador
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            name="active"
                            defaultChecked={m.active}
                            className="h-4 w-4 accent-brand-500"
                          />
                          Ativo
                        </label>
                      </div>
                    )}

                    <button type="submit" className="btn-primary btn-sm w-full">Salvar</button>
                  </form>
                  )}

                  {canGrantFinance && (
                    <form action={updateTreasurer} className="mt-2 rounded-lg border border-ink-700 p-2">
                      <input type="hidden" name="id" value={m.id} />
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          name="isTreasurer"
                          defaultChecked={m.isTreasurer}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        Acesso às finanças (lançamentos, projetos e streaming)
                      </label>
                      <button type="submit" className="btn-ghost btn-sm mt-2 w-full">
                        Salvar acesso
                      </button>
                    </form>
                  )}

                  {canEdit && (
                  <form action={changePin} className="mt-2 flex gap-2">
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      minLength={4}
                      maxLength={8}
                      required
                      placeholder="Novo PIN (mín. 4)"
                      className="input py-2 text-sm"
                    />
                    <button type="submit" className="btn-ghost btn-sm shrink-0">Trocar PIN</button>
                  </form>
                  )}
                </details>
              )}
            </li>
          );
        })}
      </ul>

      {me.isAdmin && (
        <form action={createMember} className="card mt-5 space-y-3">
          <h3 className="section-title">Novo integrante</h3>
          <input name="name" required placeholder="Nome completo" className="input" />
          <div className="grid grid-cols-2 gap-2">
            <select name="instrument" required defaultValue="" className="input">
              <option value="" disabled>Função</option>
              {INSTRUMENTS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <input name="phone" placeholder="WhatsApp" className="input" />
          </div>
          <input
            name="pin"
            required
            inputMode="numeric"
            minLength={4}
            maxLength={8}
            placeholder="PIN inicial (4 dígitos)"
            className="input"
          />
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input type="checkbox" name="isAdmin" className="h-4 w-4 accent-brand-500" />
            Administrador (pode excluir eventos e gerenciar a equipe)
          </label>
          <button type="submit" className="btn-primary w-full">Adicionar</button>
        </form>
      )}

      <p className="mt-5 text-center text-xs text-slate-500">
        O PIN é um acesso simples pensado para uso interno da banda. Não use a mesma senha
        de banco ou e-mail.
      </p>
    </>
  );
}
