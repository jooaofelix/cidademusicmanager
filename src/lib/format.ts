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
