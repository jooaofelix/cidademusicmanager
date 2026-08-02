import Link from "next/link";
import { brl } from "@/lib/format";
import { Chip, Stat } from "@/components/ui";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  labelOf,
} from "@/lib/constants";
import { addEventTransaction } from "../actions";

type Tx = {
  id: string;
  type: string;
  category: string;
  amountCents: number;
  description: string | null;
  method: string | null;
};

export function MoneyTab({ eventId, transactions }: { eventId: string; transactions: Tx[] }) {
  const income = transactions
    .filter((t) => t.type === "ENTRADA")
    .reduce((a, t) => a + t.amountCents, 0);
  const expense = transactions
    .filter((t) => t.type === "SAIDA")
    .reduce((a, t) => a + t.amountCents, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Entradas" value={brl(income)} tone="positive" />
        <Stat label="Saídas" value={brl(expense)} tone="negative" />
        <Stat
          label="Saldo"
          value={brl(income - expense)}
          tone={income - expense >= 0 ? "brand" : "negative"}
        />
      </div>

      {transactions.length > 0 && (
        <ul className="space-y-2">
          {transactions.map((t) => (
            <li key={t.id} className="card-tight flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {t.description || labelOf(
                    t.type === "ENTRADA" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
                    t.category
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Chip>
                    {labelOf(
                      t.type === "ENTRADA" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
                      t.category
                    )}
                  </Chip>
                  {t.method && <Chip>{t.method}</Chip>}
                </div>
              </div>
              <span
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  t.type === "ENTRADA" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.type === "ENTRADA" ? "+" : "−"}
                {brl(t.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={addEventTransaction} className="card space-y-3">
        <h3 className="section-title">Lançar no evento</h3>
        <input type="hidden" name="eventId" value={eventId} />

        <div className="grid grid-cols-2 gap-2">
          <select name="type" defaultValue="ENTRADA" className="input">
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
          </select>
          <input
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            className="input"
          />
        </div>

        <select name="category" defaultValue="OFERTA" className="input">
          <optgroup label="Entradas">
            {INCOME_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
          <optgroup label="Saídas">
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </optgroup>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <input name="description" placeholder="Descrição" className="input" />
          <select name="method" defaultValue="" className="input">
            <option value="">Forma</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-ghost w-full">Lançar</button>
        <p className="text-xs text-slate-500">
          Tudo que você lançar aqui entra automaticamente no caixa geral em{" "}
          <Link href="/financas" className="text-brand-400 underline underline-offset-2">
            Finanças
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
