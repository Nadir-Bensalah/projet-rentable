import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand-600 dark:fill-brand-500" />
      <path d="M9 9.5h9.5a4.5 4.5 0 0 1 0 9H13" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M13 13.5v9.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <path d="m17.5 21 2.5 2.5 4.5-5" stroke="#6ee7b7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[1.15rem] font-bold tracking-tight text-[var(--fg)]">Relevéo</span>
    </span>
  );
}
