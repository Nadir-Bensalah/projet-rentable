import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/account/actions";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/compte");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mon compte</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <LogoutButton />
      </div>
      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
