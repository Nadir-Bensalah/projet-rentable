"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { useAccount } from "./use-account";

export function HeaderAuth({ compact = false }: { compact?: boolean }) {
  const { state } = useAccount();
  if (state.status === "authenticated") {
    return (
      <Link href="/compte" className={buttonClass("secondary", "sm", compact ? "w-full" : undefined)} data-cta="header-account">
        <UserRound className="size-4" aria-hidden />
        Mon compte
      </Link>
    );
  }
  return (
    <div className={compact ? "grid gap-2" : "flex items-center gap-1"}>
      <Link href="/connexion" className={buttonClass("ghost", "sm", compact ? "w-full" : undefined)}>
        Connexion
      </Link>
      <Link href="/convertir" className={buttonClass("primary", "sm", compact ? "w-full" : undefined)} data-cta="header-try">
        Convertir un relevé
      </Link>
    </div>
  );
}
