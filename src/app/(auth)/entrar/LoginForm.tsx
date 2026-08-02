"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";

type Member = { id: string; name: string; instrument: string };

export function LoginForm({ members }: { members: Member[] }) {
  const [selected, setSelected] = useState<string>("");
  const [state, formAction, pending] = useActionState(login, null as { error?: string } | null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="memberId" value={selected} />

      <div>
        <span className="label">Quem é você?</span>
        <div className="grid grid-cols-2 gap-2">
          {members.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-brand-500 bg-brand-600/15"
                    : "border-ink-700 bg-ink-850 hover:border-ink-600"
                }`}
              >
                <span className="block text-sm font-semibold leading-tight">{m.name}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{m.instrument}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={8}
          placeholder="••••"
          className="input text-center text-2xl tracking-[0.5em]"
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending || !selected} className="btn-primary w-full py-3">
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
