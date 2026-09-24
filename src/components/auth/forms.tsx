"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { captureUtm, track } from "@/lib/analytics/client";
import { api } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { fetchMe } from "@/components/layout/use-account";

function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean; describedBy?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required className="pr-12" aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-subtle hover:text-[var(--fg)]" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

function readRefCode(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("ref") ?? sessionStorage.getItem("rv_ref");
  } catch {
    return null;
  }
}

export function SignupForm({ onSuccess, onSwitch, compact }: { onSuccess: () => void; onSwitch?: () => void; compact?: boolean }) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string; terms?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: typeof fieldError = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) fe.email = "Saisissez une adresse e-mail valide.";
    if (password.length < 10) fe.password = "Au moins 10 caractères.";
    if (!terms) fe.terms = "Vous devez accepter les conditions pour créer un compte.";
    setFieldError(fe);
    if (Object.keys(fe).length) return;
    setLoading(true);
    setError(null);
    track("signup_started");
    const utm = captureUtm();
    const res = await api("/api/auth/signup", {
      body: {
        email,
        password,
        acceptTerms: true,
        marketingOptIn: marketing,
        referralCode: readRefCode(),
        firstTouch: { source: utm.source ?? null, medium: utm.medium ?? null, campaign: utm.campaign ?? null, landing: utm.landing ?? null },
      },
    });
    setLoading(false);
    if (!res.ok) {
      if (res.data.code === "weak_password") setFieldError({ password: res.data.error });
      else setError(res.data.error ?? "Inscription impossible pour le moment.");
      return;
    }
    await fetchMe(true);
    onSuccess();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {error ? (
        <Alert tone="error">
          {error}{" "}
          {error.includes("existe déjà") && onSwitch ? (
            <button type="button" className="font-semibold underline" onClick={onSwitch}>
              Se connecter
            </button>
          ) : null}
        </Alert>
      ) : null}
      <Field id={`${uid}-email`} label="Adresse e-mail" error={fieldError.email}>
        <Input id={`${uid}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!fieldError.email || undefined} aria-describedby={fieldError.email ? `${uid}-email-error` : undefined} />
      </Field>
      <Field id={`${uid}-password`} label="Mot de passe" hint="10 caractères minimum. Une phrase de passe est idéale." error={fieldError.password}>
        <PasswordInput id={`${uid}-password`} value={password} onChange={setPassword} autoComplete="new-password" invalid={!!fieldError.password} describedBy={fieldError.password ? `${uid}-password-error` : `${uid}-password-hint`} />
      </Field>
      <div className="grid gap-2.5">
        <Checkbox
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          label={
            <>
              J&apos;accepte les{" "}
              <Link href="/cgu" target="_blank" className="font-medium text-brand-600 underline dark:text-brand-300">
                conditions d&apos;utilisation
              </Link>{" "}
              et j&apos;ai lu la{" "}
              <Link href="/confidentialite" target="_blank" className="font-medium text-brand-600 underline dark:text-brand-300">
                politique de confidentialité
              </Link>
              .
            </>
          }
        />
        {fieldError.terms ? <p role="alert" className="text-sm font-medium text-rose-600">{fieldError.terms}</p> : null}
        {!compact ? <Checkbox checked={marketing} onChange={(e) => setMarketing(e.target.checked)} label="Je souhaite recevoir les nouveautés de Relevéo (un e-mail par mois au plus, désinscription en un clic)." /> : null}
      </div>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Créer mon compte gratuit
      </Button>
      {onSwitch ? (
        <p className="text-center text-sm text-muted">
          Déjà un compte ?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Se connecter
          </button>
        </p>
      ) : null}
    </form>
  );
}

export function LoginForm({ onSuccess, onSwitch }: { onSuccess: () => void; onSwitch?: () => void }) {
  const uid = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Saisissez votre e-mail et votre mot de passe.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await api("/api/auth/login", { body: { email, password } });
    setLoading(false);
    if (!res.ok) {
      setError(res.data.error ?? "Connexion impossible.");
      return;
    }
    await fetchMe(true);
    onSuccess();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id={`${uid}-email`} label="Adresse e-mail">
        <Input id={`${uid}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <div>
        <Field id={`${uid}-password`} label="Mot de passe">
          <PasswordInput id={`${uid}-password`} value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <Link href="/mot-de-passe-oublie" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
          Mot de passe oublié ?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Se connecter
      </Button>
      {onSwitch ? (
        <p className="text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <button type="button" onClick={onSwitch} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Créer un compte gratuit
          </button>
        </p>
      ) : null}
    </form>
  );
}
