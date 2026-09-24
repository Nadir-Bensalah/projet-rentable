import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { queryOne } from "@/lib/db";
import { DeleteAccountForm, PasswordForm, ProfileForm, SignOutOthersButton } from "@/components/account/actions";
import { buttonClass } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?suite=/compte/parametres");
  const row = await queryOne<{ marketing_opt_in: boolean }>(`SELECT marketing_opt_in FROM users WHERE id = $1`, [user.id]);
  return (
    <div className="grid gap-6">
      <section className="surface p-6" aria-labelledby="profile-title">
        <h2 id="profile-title" className="mb-4 font-bold">
          Profil
        </h2>
        <ProfileForm name={user.name} marketing={row?.marketing_opt_in ?? false} />
      </section>
      <section className="surface p-6" aria-labelledby="security-title">
        <h2 id="security-title" className="mb-4 font-bold">
          Sécurité
        </h2>
        <PasswordForm />
        <div className="mt-6 border-t border-[var(--border)] pt-6">
          <SignOutOthersButton />
        </div>
      </section>
      <section className="surface p-6" aria-labelledby="data-title">
        <h2 id="data-title" className="font-bold">
          Mes données
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Téléchargez toutes les données liées à votre compte (profil, abonnement, paiements, historique d&apos;utilisation). Le contenu de
          vos relevés n&apos;y figure pas : nous ne le recevons jamais.
        </p>
        <a href="/api/account/export" className={buttonClass("secondary", "md", "mt-4")} download>
          <Download className="size-4" aria-hidden /> Exporter mes données (JSON)
        </a>
      </section>
      <section className="rounded-2xl border border-rose-200 p-6 dark:border-rose-900" aria-labelledby="delete-title">
        <h2 id="delete-title" className="mb-2 font-bold text-rose-700 dark:text-rose-400">
          Supprimer mon compte
        </h2>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
