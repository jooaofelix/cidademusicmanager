import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { href: string; label?: string };
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back.label ?? "Voltar"}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-600 px-5 py-10 text-center">
      <p className="font-medium text-slate-300">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "brand";
  hint?: string;
}) {
  const tones = {
    neutral: "text-slate-100",
    positive: "text-emerald-400",
    negative: "text-red-400",
    brand: "text-brand-400",
  };
  return (
    <div className="card-tight">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

const CHIP_TONES: Record<string, string> = {
  slate: "tint-slate",
  green: "tint-green",
  red: "tint-red",
  amber: "tint-amber",
  blue: "tint-blue",
  purple: "tint-purple",
};

export function Chip({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: keyof typeof CHIP_TONES;
}) {
  return <span className={`chip ${CHIP_TONES[tone] ?? CHIP_TONES.slate}`}>{children}</span>;
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className={`h-full rounded-full transition-all ${
          tone === "green" ? "bg-emerald-500" : "bg-brand-500"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Tabs({
  items,
  current,
}: {
  items: { href: string; label: string }[];
  current: string;
}) {
  return (
    <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
            current === i.href
              ? "border-brand-500 tint-blue"
              : "border-ink-700 bg-ink-850 text-slate-400"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </div>
  );
}
