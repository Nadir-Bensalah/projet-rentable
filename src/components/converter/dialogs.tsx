"use client";

import { Check, MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PACK, PLANS, formatPrice, type ProductId } from "@/config/plans";
import { track } from "@/lib/analytics/client";
import { api } from "@/lib/api-client";
import type { ParsedStatement } from "@/lib/statement/types";
import { LoginForm, SignupForm } from "@/components/auth/forms";
import { fetchMe } from "@/components/layout/use-account";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/field";

export function AuthDialog({ open, onClose, onAuthenticated }: { open: boolean; onClose: () => void; onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === "signup" ? "Créez votre compte gratuit pour télécharger" : "Connectez-vous pour télécharger"}
      description={mode === "signup" ? "15 pages gratuites chaque mois, sans carte bancaire. Votre relevé reste sur cet appareil." : "Votre conversion est conservée dans cet onglet."}
    >
      {mode === "signup" ? (
        <SignupForm compact onSuccess={onAuthenticated} onSwitch={() => setMode("login")} />
      ) : (
        <LoginForm onSuccess={onAuthenticated} onSwitch={() => setMode("signup")} />
      )}
    </Dialog>
  );
}

/** Waits for the e-mail confirmation (done in another tab) and resumes automatically. */
export function VerifyDialog({ open, email, onClose, onVerified }: { open: boolean; email?: string; onClose: () => void; onVerified: () => void }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(async () => {
      const me = await fetchMe(true);
      if (me.status === "authenticated" && me.account.user.emailVerified) {
        clearInterval(t);
        onVerified();
      }
    }, 4000);
    return () => clearInterval(t);
  }, [open, onVerified]);
  return (
    <Dialog open={open} onClose={onClose} title="Confirmez votre adresse e-mail" description="Une dernière étape avant votre téléchargement.">
      <div className="grid gap-5">
        <div className="flex items-start gap-3 rounded-xl bg-[var(--bg-subtle)] p-4">
          <MailCheck className="mt-0.5 size-6 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
          <p className="text-sm leading-relaxed">
            Nous avons envoyé un lien de confirmation à <strong>{email ?? "votre adresse"}</strong>. Cliquez dessus (il s&apos;ouvre dans un nouvel onglet) : votre téléchargement démarrera ici automatiquement.
          </p>
        </div>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            loading={sending}
            onClick={async () => {
              setSending(true);
              const res = await api("/api/auth/resend-verification", { body: {} });
              setSending(false);
              setMessage(res.ok ? { tone: "success", text: "E-mail renvoyé. Pensez à vérifier vos courriers indésirables." } : { tone: "error", text: res.data.error ?? "Envoi impossible." });
            }}
          >
            Renvoyer l&apos;e-mail
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              const me = await fetchMe(true);
              if (me.status === "authenticated" && me.account.user.emailVerified) onVerified();
              else setMessage({ tone: "error", text: "Adresse pas encore confirmée. Ouvrez le lien reçu par e-mail." });
            }}
          >
            J&apos;ai confirmé mon adresse
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function PaywallDialog({
  open,
  onClose,
  reason,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  reason: string;
  onCheckout: (product: ProductId) => Promise<string | null>;
}) {
  const [loading, setLoading] = useState<ProductId | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) track("paywall_shown", { reason: reason.slice(0, 60) });
  }, [open, reason]);
  const go = async (p: ProductId) => {
    setLoading(p);
    setError(null);
    const err = await onCheckout(p);
    if (err) {
      setError(err);
      setLoading(null);
    }
  };
  const options: { id: ProductId; title: string; price: string; note: string; highlight?: boolean; features: string[] }[] = [
    { id: "pack", title: PACK.name, price: formatPrice(PACK.price), note: "paiement unique", features: ["Valable 12 mois", "Tous les formats", "Plusieurs relevés et fusion"] },
    { id: "pro_monthly", title: `${PLANS.pro.name}`, price: `${formatPrice(PLANS.pro.priceMonthly)}`, note: "par mois, sans engagement", highlight: true, features: [`${PLANS.pro.monthlyPages} pages / mois`, "Tous les formats", "Rapport de contrôle"] },
    { id: "business_monthly", title: `${PLANS.business.name}`, price: `${formatPrice(PLANS.business.priceMonthly)}`, note: "par mois, sans engagement", features: [`${PLANS.business.monthlyPages} pages / mois`, "Journal de banque paramétrable", "Support prioritaire"] },
  ];
  return (
    <Dialog open={open} onClose={onClose} title="Passez à la vitesse supérieure" description={reason} className="max-w-3xl">
      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((o) => (
          <div key={o.id} className={o.highlight ? "rounded-2xl border-2 border-brand-500 p-5" : "rounded-2xl border border-[var(--border)] p-5"}>
            <p className="font-semibold">{o.title}</p>
            <p className="mt-2">
              <span className="text-2xl font-bold tabular">{o.price}</span> <span className="text-sm text-subtle">{o.note}</span>
            </p>
            <ul className="mt-3 grid gap-1.5 text-sm text-muted">
              {o.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" variant={o.highlight ? "primary" : "secondary"} loading={loading === o.id} disabled={!!loading && loading !== o.id} onClick={() => go(o.id)}>
              Choisir
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-subtle">Paiement sécurisé par notre prestataire. Votre conversion est conservée dans cet onglet pendant le paiement.</p>
    </Dialog>
  );
}

export function ReportLayoutDialog({ open, onClose, statement }: { open: boolean; onClose: () => void; statement?: ParsedStatement }) {
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  if (!statement) return null;
  const summary = {
    bankId: statement.bankId ?? null,
    pageCount: statement.pageCount,
    transactionCount: statement.transactions.length,
    columns: statement.columns,
    status: statement.reconciliation.status,
    kind: statement.kind,
    dateOrder: statement.dateOrder,
    decimalSeparator: statement.decimalSeparator,
    currency: statement.currency,
    warningCodes: statement.warnings.map((w) => w.replace(/\d+/g, "#")).slice(0, 10),
  };
  return (
    <Dialog open={open} onClose={onClose} title="Signaler un relevé mal lu" description="Aidez-nous à améliorer la lecture de ce type de relevé.">
      {state === "sent" ? (
        <Alert tone="success" title="Merci !">Votre signalement anonyme a bien été envoyé.</Alert>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("sending");
            const res = await api("/api/layout-report", { body: { summary, comment: comment || null } });
            if (res.ok) {
              setState("sent");
              track("layout_report_sent");
            } else {
              setState("error");
              setError(res.data.error ?? "Envoi impossible.");
            }
          }}
        >
          <p className="text-sm leading-relaxed text-muted">
            Seule la <strong>structure</strong> du résultat est envoyée : nombre de pages et d&apos;opérations, colonnes détectées, statut du contrôle et avertissements. Aucun libellé, montant, nom ou numéro de compte.
          </p>
          <pre className="max-h-40 overflow-auto rounded-xl bg-[var(--bg-subtle)] p-3 text-xs">{JSON.stringify(summary, null, 2)}</pre>
          <div>
            <label htmlFor="layout-comment" className="mb-1.5 block text-sm font-semibold">Commentaire (facultatif, sans donnée personnelle)</label>
            <Textarea id="layout-comment" value={comment} onChange={(e) => setComment(e.target.value.slice(0, 1000))} placeholder="Ex. : les montants de la colonne crédit sont lus comme des débits." />
          </div>
          {state === "error" && error ? <Alert tone="error">{error}</Alert> : null}
          <Button type="submit" loading={state === "sending"}>Envoyer le signalement anonyme</Button>
        </form>
      )}
    </Dialog>
  );
}
