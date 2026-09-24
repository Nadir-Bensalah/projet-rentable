import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  info: { box: "border-brand-200 bg-brand-50 text-brand-950 dark:border-brand-800/60 dark:bg-brand-950/40 dark:text-brand-100", icon: <Info className="size-5 text-brand-600 dark:text-brand-300" aria-hidden /> },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100", icon: <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden /> },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100", icon: <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" aria-hidden /> },
  error: { box: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-100", icon: <XCircle className="size-5 text-rose-600 dark:text-rose-400" aria-hidden /> },
};

export function Alert({ tone = "info", title, children, className, action }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", tones[tone].box, className)}>
      <div className="shrink-0 pt-0.5">{tones[tone].icon}</div>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-1" : null, "opacity-90")}>{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
