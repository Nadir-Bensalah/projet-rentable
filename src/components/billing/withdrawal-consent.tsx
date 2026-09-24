"use client";

import Link from "next/link";
import { WITHDRAWAL_CONSENT_TEXT } from "@/config/consent";
import { cn } from "@/lib/cn";

export function WithdrawalConsent({
  checked,
  onChange,
  invalid,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-sm",
        invalid ? "border-rose-500" : "border-[var(--border)]",
        className,
      )}
    >
      <input
        id="withdrawal-consent"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? "withdrawal-consent-error" : undefined}
        className="mt-0.5 size-4.5 shrink-0 accent-[var(--color-brand-600)]"
      />
      <div>
        <label htmlFor="withdrawal-consent" className="text-muted">
          {WITHDRAWAL_CONSENT_TEXT}{" "}
          <Link href="/cgv#retractation" className="font-medium text-brand-600 underline dark:text-brand-300">
            Voir les CGV
          </Link>
        </label>
        {invalid ? (
          <p id="withdrawal-consent-error" role="alert" className="mt-1 font-medium text-rose-600">
            Cochez cette case pour continuer vers le paiement.
          </p>
        ) : null}
      </div>
    </div>
  );
}
