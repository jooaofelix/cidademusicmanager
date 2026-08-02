"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Início", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/agenda", label: "Agenda", icon: CalendarIcon, match: (p: string) => p.startsWith("/agenda") },
  { href: "/repertorio", label: "Músicas", icon: MusicIcon, match: (p: string) => p.startsWith("/repertorio") },
  { href: "/checklist", label: "Checklist", icon: CheckIcon, match: (p: string) => p.startsWith("/checklist") },
  { href: "/financas", label: "Finanças", icon: WalletIcon, match: (p: string) => p.startsWith("/financas") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-900/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-brand-400" : "text-slate-500"
                }`}
              >
                <Icon active={active} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { active?: boolean };
const base = "h-[22px] w-[22px]";

function HomeIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" fill={active ? "currentColor" : "none"} fillOpacity="0.25" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function MusicIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18V6l11-2v12" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" fill={active ? "currentColor" : "none"} />
      <circle cx="17" cy="16" r="3" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function CheckIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="17" rx="2" fill={active ? "currentColor" : "none"} fillOpacity="0.25" />
      <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ active }: IconProps) {
  return (
    <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="14" rx="2.5" fill={active ? "currentColor" : "none"} fillOpacity="0.25" />
      <path d="M3 10h18M16.5 15h.01" strokeLinecap="round" />
    </svg>
  );
}
