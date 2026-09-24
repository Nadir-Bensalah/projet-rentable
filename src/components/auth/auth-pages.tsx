"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import { fetchMe } from "@/components/layout/use-account";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { LoginForm, SignupForm } from "./forms";

/** Only same-site relative paths are accepted as post-login destinations (no open redirect). */
export function safeNext(v: string | null, fallback = "/convertir") {
  // Reject control characters (browsers strip TAB/CR/LF: "/\t/evil.com" becomes "//evil.com") and backslashes.
  if (!v || !v.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(v)) return fallback;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(v, base);
    if (u.origin !== base) return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

export function LoginPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <LoginForm
      onSuccess={() => {
        router.push(safeNext(params.get("suite"), "/compte"));
        router.refresh();
      }}
      onSwitch={() => router.push(`/inscription${params.get("suite") ? `?suite=${encodeURIComponent(params.get("suite")!)}` : ""}`)}
    />
  );
}

export function SignupPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      try {
        sessionStorage.setItem("rv_ref", ref.toUpperCase());
      } catch {
        /* ignore */
      }
    }
  }, [params]);
  return (
    <SignupForm
      onSuccess={() => {
        router.push(safeNext(params.get("suite"), "/convertir?bienvenue=1"));
        router.refresh();
      }}
      onSwitch={() => router.push("/connexion")}
    />
  );
}

export function ForgotPageClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (done) {
    return (
      <Alert tone="success" title="Vérifiez votre boîte de réception">
        Si un compte existe pour {email}, vous allez recevoir un lien de réinitialisation valable 1 heure. Pensez à regarder dans les
        courriers indésirables.
      </Alert>
    );
  }
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          setError("Saisissez une adresse e-mail valide.");
          return;
        }
        setLoading(true);
        setError(null);
        const res = await api("/api/auth/forgot", { body: { email } });
        setLoading(false);
        if (res.ok) setDone(true);
        else setError(res.data.error ?? "Envoi impossible.");
      }}
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="forgot-email" label="Adresse e-mail du compte">
        <Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Recevoir un lien
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/connexion" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!token) {
    return (
      <Alert tone="error" title="Lien incomplet">
        Ce lien de réinitialisation est incomplet.{" "}
        <Link href="/mot-de-passe-oublie" className="font-semibold underline">
          Refaire une demande
        </Link>
        .
      </Alert>
    );
  }
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 10) return setError("Le mot de passe doit contenir au moins 10 caractères.");
        if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
        setLoading(true);
        setError(null);
        const res = await api("/api/auth/reset", { body: { token, password } });
        setLoading(false);
        if (!res.ok) return setError(res.data.error ?? "Réinitialisation impossible.");
        await fetchMe(true);
        router.push("/compte?motdepasse=modifie");
        router.refresh();
      }}
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="new-password" label="Nouveau mot de passe" hint="10 caractères minimum.">
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>
      <Field id="confirm-password" label="Confirmer le mot de passe">
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Enregistrer et me connecter
      </Button>
    </form>
  );
}

export function VerifyPageClient() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Ce lien de confirmation est incomplet.");
  const once = useRef(false);
  useEffect(() => {
    if (!token || once.current) return;
    once.current = true;
    api<{ signedIn: boolean }>("/api/auth/verify", { body: { token } }).then(async (res) => {
      if (res.ok) {
        await fetchMe(true);
        setSignedIn(!!res.data.signedIn);
        setState("ok");
      } else {
        setState("error");
        setError(res.data.error ?? "Ce lien est invalide ou a expiré.");
      }
    });
  }, [token]);
  if (state === "loading") {
    return (
      <p className="flex items-center justify-center gap-2 text-muted" aria-live="polite">
        <Spinner /> Confirmation en cours…
      </p>
    );
  }
  if (state === "ok") {
    return (
      <div className="grid gap-5 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <div>
          <p className="text-lg font-semibold">Adresse confirmée, merci !</p>
          <p className="mt-1 text-muted">
            {signedIn
              ? "Si une conversion attend dans un autre onglet, votre téléchargement y démarre automatiquement. Vous pouvez fermer cet onglet."
              : "Si une conversion attend dans l'onglet où vous vous êtes inscrit, le téléchargement y démarre automatiquement. Sinon, connectez-vous pour continuer."}
          </p>
        </div>
        {signedIn ? <ButtonLink href="/convertir">Convertir un relevé</ButtonLink> : <ButtonLink href="/connexion?suite=/convertir">Me connecter</ButtonLink>}
      </div>
    );
  }
  return (
    <Alert tone="error" title="Confirmation impossible">
      {error} Connectez-vous puis demandez un nouvel e-mail depuis votre espace.
    </Alert>
  );
}
