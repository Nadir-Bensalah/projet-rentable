"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/compte", label: "Aperçu" },
  { href: "/compte/abonnement", label: "Abonnement et factures" },
  { href: "/compte/parametres", label: "Paramètres et données" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Espace compte" className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--border)]">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={pathname === i.href ? "page" : undefined}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold",
            pathname === i.href ? "border-brand-600 text-[var(--fg)]" : "border-transparent text-muted hover:text-[var(--fg)]",
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
