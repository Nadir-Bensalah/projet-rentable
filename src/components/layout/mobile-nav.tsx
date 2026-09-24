"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderAuth } from "./header-auth";
import { NAV } from "./nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-10 items-center justify-center rounded-xl text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 pb-5 pt-2 shadow-[var(--shadow-lift)] animate-fade-up">
          <nav aria-label="Navigation principale">
            <ul className="grid">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="block rounded-lg px-3 py-3 text-base font-medium text-[var(--fg)] hover:bg-[var(--bg-subtle)]" aria-current={pathname === item.href ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 border-t border-[var(--border)] pt-4">
            <HeaderAuth compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
