"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const TOPICS = [
  ["question", "Question sur le produit"],
  ["releve-non-reconnu", "Un relevé est mal lu"],
  ["facturation", "Facturation et abonnement"],
  ["donnees-personnelles", "Données personnelles"],
  ["partenariat", "Cabinet / partenariat"],
  ["autre", "Autre"],
] as const;

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>("question");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  if (state === "sent") {
    return (
      <Alert tone="success" title="Message envoyé">
        Merci ! Nous vous répondons par e-mail, en général sous deux jours ouvrés.
      </Alert>
    );
  }
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Saisissez une adresse e-mail valide.");
        if (message.trim().length < 10) return setError("Votre message est trop court.");
        setState("sending");
        setError(null);
        const res = await api("/api/contact", { body: { email, topic, message, website } });
        if (res.ok) setState("sent");
        else {
          setState("idle");
          setError(res.data.error ?? "Envoi impossible.");
        }
      }}
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Field id="c-email" label="Votre adresse e-mail">
        <Input id="c-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field id="c-topic" label="Sujet">
        <Select id="c-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="c-message" label="Message" hint="N'envoyez jamais votre relevé ni de données bancaires par ce formulaire.">
        <Textarea id="c-message" value={message} onChange={(e) => setMessage(e.target.value.slice(0, 5000))} required />
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="c-website">Ne pas remplir</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div>
        <Button type="submit" loading={state === "sending"}>
          Envoyer
        </Button>
      </div>
    </form>
  );
}
