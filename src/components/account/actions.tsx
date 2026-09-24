"use client";

import { Copy, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { setAccount } from "@/components/layout/use-account";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={loading}
      icon={<LogOut className="size-4" aria-hidden />}
      onClick={async () => {
        setLoading(true);
        await api("/api/auth/logout", { body: {} });
        setAccount(null);
        router.push("/");
        router.refresh();
      }}
    >
      Se déconnecter
    </Button>
  );
}

export function ResendVerification() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          const res = await api("/api/auth/resend-verification", { body: {} });
          setLoading(false);
          setMsg(res.ok ? { ok: true, text: "E-mail envoyé." } : { ok: false, text: res.data.error ?? "Envoi impossible." });
        }}
      >
        Renvoyer l&apos;e-mail de confirmation
      </Button>
      {msg ? (
        <span className={msg.ok ? "text-sm text-emerald-700" : "text-sm text-rose-600"} role="status">
          {msg.text}
        </span>
      ) : null}
    </div>
  );
}

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <label className="sr-only" htmlFor="copy-field">
        {label}
      </label>
      <Input id="copy-field" readOnly value={value} onFocus={(e) => e.target.select()} className="font-mono text-sm" />
      <Button
        variant="secondary"
        icon={<Copy className="size-4" aria-hidden />}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? "Copié" : "Copier"}
      </Button>
    </div>
  );
}

export function ManageSubscriptionButton({ label = "Gérer mon abonnement" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        loading={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const res = await api<{ url: string }>("/api/billing/portal", { body: {} });
          if (res.ok && res.data.url) {
            window.location.href = res.data.url;
            return;
          }
          setLoading(false);
          setError(res.data.error ?? "Indisponible pour le moment.");
        }}
      >
        {label}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProfileForm({ name, marketing }: { name: string | null; marketing: boolean }) {
  const [value, setValue] = useState(name ?? "");
  const [opt, setOpt] = useState(marketing);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await api("/api/account", { method: "PATCH", body: { name: value || null, marketingOptIn: opt } });
        setLoading(false);
        setMsg(res.ok ? { ok: true, text: "Modifications enregistrées." } : { ok: false, text: res.data.error ?? "Erreur." });
      }}
    >
      <Field id="profile-name" label="Nom (facultatif)">
        <Input id="profile-name" value={value} maxLength={80} onChange={(e) => setValue(e.target.value)} autoComplete="name" />
      </Field>
      <Checkbox checked={opt} onChange={(e) => setOpt(e.target.checked)} label="Recevoir les nouveautés de Relevéo par e-mail" />
      {msg ? <Alert tone={msg.ok ? "success" : "error"}>{msg.text}</Alert> : null}
      <div>
        <Button type="submit" loading={loading}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await api("/api/account/password", { body: { current, next } });
        setLoading(false);
        if (res.ok) {
          setCurrent("");
          setNext("");
        }
        setMsg(
          res.ok
            ? { ok: true, text: "Mot de passe modifié. Vos autres sessions ont été déconnectées." }
            : { ok: false, text: res.data.error ?? "Erreur." },
        );
      }}
    >
      <Field id="pw-current" label="Mot de passe actuel">
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </Field>
      <Field id="pw-next" label="Nouveau mot de passe" hint="10 caractères minimum.">
        <Input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
      </Field>
      {msg ? <Alert tone={msg.ok ? "success" : "error"}>{msg.text}</Alert> : null}
      <div>
        <Button type="submit" loading={loading}>
          Changer le mot de passe
        </Button>
      </div>
    </form>
  );
}

export function SignOutOthersButton() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        onClick={async () => {
          const res = await api("/api/account/sessions", { method: "DELETE" });
          setMsg(res.ok ? "Les autres appareils ont été déconnectés." : (res.data.error ?? "Erreur."));
        }}
      >
        Déconnecter mes autres appareils
      </Button>
      {msg ? (
        <span role="status" className="text-sm text-muted">
          {msg}
        </span>
      ) : null}
    </div>
  );
}

export function DeleteAccountForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await api("/api/account/delete", { body: { password, confirm } });
        setLoading(false);
        if (!res.ok) return setError(res.data.error ?? "Suppression impossible.");
        setAccount(null);
        router.push("/?compte=supprime");
        router.refresh();
      }}
    >
      <p className="text-sm leading-relaxed text-muted">
        La suppression est immédiate et définitive : compte, crédits restants et historique d&apos;utilisation. Un abonnement en cours est
        résilié. Les factures restent conservées par notre prestataire de paiement, comme la loi l&apos;exige.
      </p>
      <Field id="del-password" label="Mot de passe">
        <Input
          id="del-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field
        id="del-confirm"
        label={
          <>
            Tapez <strong>SUPPRIMER</strong> pour confirmer
          </>
        }
      >
        <Input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" required />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div>
        <Button type="submit" variant="danger" loading={loading} disabled={confirm !== "SUPPRIMER" || !password}>
          Supprimer définitivement mon compte
        </Button>
      </div>
    </form>
  );
}
