import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember, destroySession } from "@/lib/session";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await destroySession();
  redirect("/entrar");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  if (!member) redirect("/entrar");

  const initials = member.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-800 text-xs font-black">
              CM
            </span>
            <span className="text-sm font-semibold tracking-tight">Cidade Music</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/equipe"
              className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 py-1 pl-1 pr-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold">
                {initials}
              </span>
              <span className="text-xs font-medium text-slate-300">
                {member.name.split(" ")[0]}
              </span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                aria-label="Sair"
                className="rounded-full border border-ink-700 bg-ink-850 p-1.5 text-slate-400 hover:text-slate-200"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>

      <BottomNav />
    </div>
  );
}
