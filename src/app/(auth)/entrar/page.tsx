import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  if (await getCurrentMember()) redirect("/");

  const members = await db.member.findMany({
    where: { active: true },
    orderBy: [{ isAdmin: "desc" }, { name: "asc" }],
    select: { id: true, name: true, instrument: true },
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-2xl font-black shadow-lg shadow-brand-900/40">
          CM
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Cidade Music</h1>
        <p className="mt-1 text-sm text-slate-400">
          Escala, repertório e finanças da banda
        </p>
      </div>

      {members.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          Nenhum integrante cadastrado ainda.
          <br />
          Rode <code className="text-brand-300">npm run db:seed</code> para criar a equipe.
        </div>
      ) : (
        <LoginForm members={members} />
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Seu PIN inicial tem 4 dígitos. Você pode trocá-lo depois em Equipe.
      </p>
    </main>
  );
}
