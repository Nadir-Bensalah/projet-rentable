import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border bg-[var(--bg-elevated)] px-3.5 text-[0.95rem] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] border-[var(--border-strong)] transition-shadow focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 aria-[invalid=true]:border-rose-500 aria-[invalid=true]:focus:ring-rose-500/15 disabled:opacity-60";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-32 py-3 leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10", className)} {...rest} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
      {children}
    </select>
  );
}

export function Label({ className, ...rest }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-semibold text-[var(--fg)]", className)} {...rest} />;
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, className, ...rest }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted", className)}>
      <input type="checkbox" className="mt-0.5 size-4.5 shrink-0 cursor-pointer rounded border-[var(--border-strong)] accent-brand-600" {...rest} />
      <span>{label}</span>
    </label>
  );
}
