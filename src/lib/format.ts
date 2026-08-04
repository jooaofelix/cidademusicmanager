export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** "1.234,56" ou "1234.56" -> 123456 (centavos) */
export function parseMoneyToCents(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === "number") return Math.round(input * 100);

  let s = input.trim().replace(/[^\d,.-]/g, "");
  if (!s) return 0;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > lastDot) {
    // formato brasileiro: 1.234,56
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // formato americano: 1,234.56
    s = s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export function fmtDateLong(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${DIAS[date.getUTCDay()]}, ${date.getUTCDate()} de ${
    MESES[date.getUTCMonth()]
  } de ${date.getUTCFullYear()}`;
}

export function fmtDateShort(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${String(date.getUTCDate()).padStart(2, "0")}/${MESES[date.getUTCMonth()]}`;
}

/** Date -> "YYYY-MM-DD" para <input type="date"> */
export function toInputDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" -> Date em UTC (evita deslocamento de fuso) */
export function fromInputDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function periodLabel(period: string) {
  const [y, m] = period.split("-");
  const i = Number(m) - 1;
  return `${MESES[i] ?? m}/${y}`;
}

export function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function relativeDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const a = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((a - b) / 86400000);

  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 0) return `em ${diff} dias`;
  return `há ${Math.abs(diff)} dias`;
}

/**
 * A data de um compromisso, que pode passar de um dia.
 *
 * Um dia só: "sábado, 8 de agosto de 2026".
 * Dois ou mais: "8 a 9 de agosto de 2026" — e, virando o mês,
 * "30 de agosto a 1 de setembro de 2026".
 */
export function fmtPeriodoEvento(inicio: Date | string, fim?: Date | string | null) {
  const a = new Date(inicio);
  if (!fim) return fmtDateLong(a);

  const b = new Date(fim);
  if (a.toDateString() === b.toDateString()) return fmtDateLong(a);

  const mesmoMes = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const dia = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", timeZone: "UTC" });
  const diaMes = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
  const completo = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return mesmoMes ? `${dia(a)} a ${completo(b)}` : `${diaMes(a)} a ${completo(b)}`;
}

/** Versão curta, para listas: "8 a 9/08" ou só "08/08". */
export function fmtPeriodoCurto(inicio: Date | string, fim?: Date | string | null) {
  const a = new Date(inicio);
  if (!fim) return fmtDate(a);
  const b = new Date(fim);
  if (a.toDateString() === b.toDateString()) return fmtDate(a);
  return `${fmtDate(a)} a ${fmtDate(b)}`;
}

/** Quantos dias o compromisso ocupa, contando início e fim. */
export function diasDoEvento(inicio: Date | string, fim?: Date | string | null): number {
  if (!fim) return 1;
  const a = new Date(inicio);
  const b = new Date(fim);
  const dias = Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  return Math.max(dias, 1);
}
