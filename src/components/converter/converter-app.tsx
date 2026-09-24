"use client";

import { strToU8, zipSync } from "fflate";
import {
  AlertTriangle,
  Download,
  FileText,
  Flag,
  KeyRound,
  Lock,
  Printer,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductId } from "@/config/plans";
import { track } from "@/lib/analytics/client";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { EXPORT_FORMATS, buildExport, type ExportFormat } from "@/lib/statement/export";
import type { ParsedStatement, Transaction } from "@/lib/statement/types";
import type { AccountView } from "@/lib/account-view";
import { fetchMe, setAccount, useAccount } from "@/components/layout/use-account";
import { Alert } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { ControlReport } from "./control-report";
import { AuthDialog, PaywallDialog, ReportLayoutDialog, VerifyDialog } from "./dialogs";
import { frLongDate } from "./format";
import { ReconciliationCard } from "./reconciliation-card";
import { TransactionsTable } from "./transactions-table";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  clearWorkspace,
  formatBytes,
  loadWorkspace,
  newId,
  processPdf,
  saveWorkspace,
  withReconciliation,
  type Doc,
} from "./workspace";

type Scope = "current" | "merge" | "zip";

function download(data: Uint8Array | string, mime: string, filename: string) {
  const blob = new Blob([typeof data === "string" ? data : new Uint8Array(data)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ConverterApp() {
  const { state: me } = useAccount();
  const account: AccountView | null = me.status === "authenticated" ? me.account : null;
  const params = useSearchParams();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [scope, setScope] = useState<Scope>("current");
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error" | "info" | "warning"; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [paywall, setPaywall] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const bytesRef = useRef(new Map<string, ArrayBuffer>());
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingExport = useRef(false);
  const restored = useRef(false);

  // Restore the local workspace (this tab only) and load the sample on ?exemple=1.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = loadWorkspace();
    if (saved.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocs(saved);
      setActiveId(saved[0].id);
    }
    if (params.get("exemple") === "1" && !saved.some((d) => d.fileName === "releve-exemple.pdf")) {
      fetch("/exemples/releve-exemple.pdf")
        .then((r) => r.arrayBuffer())
        .then((buf) => addBuffers([{ name: "releve-exemple.pdf", size: buf.byteLength, buffer: buf }]))
        .catch(() => setNotice({ tone: "error", text: "L'exemple n'a pas pu être chargé." }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveWorkspace(docs);
  }, [docs]);

  const parsed = useMemo(() => docs.filter((d) => d.status === "parsed" && d.statement), [docs]);
  const active = docs.find((d) => d.id === activeId) ?? docs[0];
  const busy = docs.some((d) => d.status === "reading");

  const patchDoc = useCallback((id: string, patch: Partial<Doc>) => {
    setDocs((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const runParse = useCallback(
    async (id: string, fileName: string, password?: string) => {
      const buffer = bytesRef.current.get(id);
      if (!buffer) return;
      patchDoc(id, { status: "reading", error: undefined, progress: undefined });
      const started = performance.now();
      const res = await processPdf(buffer, fileName, {
        password,
        onProgress: (done, total) => patchDoc(id, { progress: { done, total } }),
      });
      if (res.kind === "parsed") {
        const st = res.statement;
        if (st.kind !== "text") {
          patchDoc(id, {
            status: "error",
            hash: res.hash,
            error:
              st.kind === "scanned"
                ? "Ce PDF est une image (document scanné) : il ne contient pas de texte à lire. Téléchargez plutôt le relevé depuis votre banque en ligne."
                : "Ce PDF est vide.",
          });
          track("parse_failed", { reason: st.kind });
          return;
        }
        patchDoc(id, { status: "parsed", statement: st, hash: res.hash, progress: undefined });
        bytesRef.current.delete(id);
        track("parse_succeeded", {
          pages: st.pageCount,
          transactions: st.transactions.length,
          status: st.reconciliation.status,
          bank: st.bankId ?? "unknown",
          ms: Math.round(performance.now() - started),
        });
      } else if (res.kind === "password") {
        patchDoc(id, { status: "password", hash: res.hash, passwordIncorrect: res.incorrect });
      } else {
        patchDoc(id, { status: "error", error: res.message, hash: res.hash });
        track("parse_failed", { reason: "invalid" });
      }
    },
    [patchDoc],
  );

  const addBuffers = useCallback(
    (files: { name: string; size: number; buffer: ArrayBuffer }[]) => {
      const created: Doc[] = files.map((f) => ({ id: newId(), fileName: f.name, size: f.size, status: "reading" }));
      created.forEach((d, i) => bytesRef.current.set(d.id, files[i].buffer));
      setDocs((ds) => [...ds, ...created]);
      setActiveId((a) => a ?? created[0]?.id ?? null);
      if (created[0]) setActiveId(created[0].id);
      // Parse sequentially to keep the tab responsive on large batches.
      (async () => {
        for (const d of created) await runParse(d.id, d.fileName);
      })();
    },
    [runParse],
  );

  const onFiles = useCallback(
    async (list: FileList | File[]) => {
      setNotice(null);
      const files = Array.from(list);
      const room = MAX_FILES - docs.length;
      const accepted: { name: string; size: number; buffer: ArrayBuffer }[] = [];
      const rejected: string[] = [];
      for (const f of files.slice(0, Math.max(0, room))) {
        const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
        if (!isPdf) rejected.push(`${f.name} n'est pas un PDF`);
        else if (f.size > MAX_FILE_BYTES) rejected.push(`${f.name} dépasse ${formatBytes(MAX_FILE_BYTES)}`);
        else if (f.size === 0) rejected.push(`${f.name} est vide`);
        else accepted.push({ name: f.name, size: f.size, buffer: await f.arrayBuffer() });
      }
      if (files.length > room) rejected.push(`maximum ${MAX_FILES} relevés à la fois`);
      if (rejected.length) setNotice({ tone: "warning", text: `Fichier(s) ignoré(s) : ${rejected.join(" ; ")}.` });
      if (accepted.length) {
        track("file_selected", { count: accepted.length });
        addBuffers(accepted);
      }
    },
    [addBuffers, docs.length],
  );

  const updateStatement = (id: string, fn: (st: ParsedStatement) => ParsedStatement) => {
    setDocs((ds) => ds.map((d) => (d.id === id && d.statement ? { ...d, statement: withReconciliation(fn(d.statement)) } : d)));
  };

  const removeDoc = (id: string) => {
    bytesRef.current.delete(id);
    setDocs((ds) => {
      const next = ds.filter((d) => d.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const resetAll = () => {
    bytesRef.current.clear();
    setDocs([]);
    setActiveId(null);
    clearWorkspace();
    setNotice(null);
  };

  const targets = useMemo(() => {
    if (scope === "current") return active?.status === "parsed" && active.statement ? [active] : [];
    return parsed;
  }, [scope, active, parsed]);

  const formatInfo = EXPORT_FORMATS.find((f) => f.id === format)!;
  const isBatch = targets.length > 1;
  const needsPaid = !formatInfo.free || isBatch;
  const locked = needsPaid && !(account?.paidFeatures ?? false);
  const pagesNeeded = targets.reduce((s, d) => s + (d.statement?.pageCount ?? 0), 0);

  const doExport = useCallback(async () => {
    if (!targets.length) return;
    track("export_clicked", { format, documents: targets.length });
    const meState = await fetchMe();
    if (meState.status !== "authenticated") {
      pendingExport.current = true;
      setAuthOpen(true);
      return;
    }
    if (!meState.account.user.emailVerified) {
      pendingExport.current = true;
      setVerifyOpen(true);
      return;
    }
    setExporting(true);
    setNotice(null);
    const res = await api<{ charged: number; reExports: number; account: AccountView }>("/api/usage/consume", {
      body: {
        format,
        documents: targets.map((d) => ({
          hash: d.hash!,
          pages: d.statement!.pageCount,
          bankId: d.statement!.bankId ?? null,
          reconciled: d.statement!.reconciliation.status,
        })),
      },
    });
    setExporting(false);
    if (res.data.account) setAccount(res.data.account);
    if (!res.ok) {
      if (res.data.code === "email_unverified") {
        pendingExport.current = true;
        setVerifyOpen(true);
      } else if (res.data.code === "paid_feature" || res.data.code === "quota_exceeded") {
        setPaywall(res.data.error ?? "Cette fonction est incluse dans les offres payantes.");
      } else if (res.status === 401) {
        pendingExport.current = true;
        setAuthOpen(true);
      } else {
        setNotice({ tone: "error", text: res.data.error ?? "L'export a échoué. Réessayez." });
      }
      return;
    }
    const statements = targets.map((d) => d.statement!);
    try {
      if (scope === "zip" && statements.length > 1) {
        const files: Record<string, Uint8Array> = {};
        for (const st of statements) {
          const out = buildExport(format, [st]);
          let name = out.filename;
          let n = 2;
          while (files[name]) name = out.filename.replace(/(\.[a-z]+)$/, `-${n++}$1`);
          files[name] = typeof out.data === "string" ? strToU8(out.data) : out.data;
        }
        download(zipSync(files), "application/zip", `releves-${new Date().toISOString().slice(0, 10)}.zip`);
      } else {
        const out = buildExport(format, statements);
        download(out.data, out.mime, out.filename);
      }
      track("export_completed", { format, documents: statements.length, charged: res.data.charged });
      const charged = res.data.charged;
      setNotice({
        tone: "success",
        text:
          charged === 0
            ? "Fichier téléchargé. Ce relevé était déjà décompté ce mois-ci : ce nouvel export est gratuit."
            : `Fichier téléchargé. ${charged} page${charged > 1 ? "s" : ""} décomptée${charged > 1 ? "s" : ""}.`,
      });
    } catch (e) {
      console.error(e);
      setNotice({ tone: "error", text: "Le fichier n'a pas pu être généré dans votre navigateur." });
    }
  }, [format, scope, targets]);

  const resumeAfterAuth = useCallback(async () => {
    setAuthOpen(false);
    const m = await fetchMe(true);
    if (!pendingExport.current) return;
    if (m.status === "authenticated" && !m.account.user.emailVerified) {
      setVerifyOpen(true);
      return;
    }
    pendingExport.current = false;
    doExport();
  }, [doExport]);

  const resumeAfterVerify = useCallback(() => {
    setVerifyOpen(false);
    if (pendingExport.current) {
      pendingExport.current = false;
      doExport();
    }
  }, [doExport]);

  const checkout = async (product: ProductId): Promise<string | null> => {
    track("checkout_clicked", { product });
    saveWorkspace(docs);
    const res = await api<{ url: string }>("/api/billing/checkout", { body: { product } });
    if (!res.ok || !res.data.url) return res.data.error ?? "Le paiement est indisponible pour le moment.";
    window.location.href = res.data.url;
    return null;
  };

  const st = active?.statement;

  return (
    <div className="grid gap-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-colors",
          dragging ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40" : "border-[var(--border-strong)] bg-[var(--bg-elevated)]",
          docs.length ? "p-5" : "p-8 sm:p-12",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          id="pdf-input"
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className={cn("flex flex-col items-center text-center", docs.length && "sm:flex-row sm:text-left sm:gap-5")}>
          <span className={cn("inline-flex items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300", docs.length ? "size-12" : "size-16")}>
            <Upload className={docs.length ? "size-6" : "size-8"} aria-hidden />
          </span>
          <div className={cn(docs.length ? "mt-3 flex-1 sm:mt-0" : "mt-5")}>
            <p className={cn("font-semibold", !docs.length && "text-lg")}>{docs.length ? "Ajouter d'autres relevés" : "Déposez vos relevés bancaires PDF ici"}</p>
            <p className="mt-1 text-sm text-muted">
              ou{" "}
              <label htmlFor="pdf-input" className="cursor-pointer font-semibold text-brand-600 underline underline-offset-4 dark:text-brand-300">
                choisissez des fichiers
              </label>{" "}
              — jusqu&apos;à {MAX_FILES} PDF de {formatBytes(MAX_FILE_BYTES)} maximum.
            </p>
          </div>
          <p className={cn("inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300", docs.length ? "mt-3 sm:mt-0" : "mt-5")}>
            <Lock className="size-3.5" aria-hidden /> Lu sur votre appareil, jamais envoyé
          </p>
        </div>
        {!docs.length ? (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              icon={<Sparkles className="size-4" aria-hidden />}
              onClick={() =>
                fetch("/exemples/releve-exemple.pdf")
                  .then((r) => r.arrayBuffer())
                  .then((buf) => addBuffers([{ name: "releve-exemple.pdf", size: buf.byteLength, buffer: buf }]))
              }
              data-cta="converter-sample"
            >
              Essayer avec un relevé d&apos;exemple (fictif)
            </Button>
          </div>
        ) : null}
      </div>

      {notice ? (
        <Alert tone={notice.tone} action={notice.tone === "success" ? undefined : undefined}>
          <div className="flex items-start justify-between gap-3">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Fermer le message" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </Alert>
      ) : null}

      {docs.length ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="grid min-w-0 gap-6">
            {/* Document tabs */}
            {docs.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Relevés chargés">
                {docs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={d.id === active?.id}
                    onClick={() => setActiveId(d.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
                      d.id === active?.id ? "border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/50 dark:text-brand-100" : "border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)]",
                    )}
                  >
                    {d.status === "reading" ? <Spinner /> : d.status === "parsed" ? <StatusDot status={d.statement!.reconciliation.status} /> : <AlertTriangle className="size-4 text-amber-500" aria-hidden />}
                    <span className="max-w-44 truncate">{d.fileName}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {active ? (
              <section aria-label={`Relevé ${active.fileName}`} className="grid gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      <FileText className="size-5 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
                      <span className="truncate">{active.fileName}</span>
                    </h2>
                    {st ? (
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                        {st.bankName ? <span>{st.bankName}</span> : null}
                        {st.periodStart ? <span>du {frLongDate(st.periodStart)} au {frLongDate(st.periodEnd)}</span> : null}
                        <span>
                          {st.pageCount} page{st.pageCount > 1 ? "s" : ""}
                        </span>
                        <span>{st.currency}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    {st ? (
                      <Button variant="ghost" size="sm" icon={<Flag className="size-4" aria-hidden />} onClick={() => setReportOpen(true)}>
                        Signaler
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" icon={<X className="size-4" aria-hidden />} onClick={() => removeDoc(active.id)} aria-label={`Retirer ${active.fileName}`}>
                      Retirer
                    </Button>
                  </div>
                </div>

                {active.status === "reading" ? (
                  <div className="surface grid gap-3 p-6" aria-live="polite">
                    <p className="flex items-center gap-2 font-medium">
                      <Spinner /> Lecture du relevé dans votre navigateur
                      {active.progress ? ` — page ${active.progress.done} sur ${active.progress.total}` : "…"}
                    </p>
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-4 w-2/3" />
                  </div>
                ) : active.status === "password" ? (
                  <form
                    className="surface grid gap-4 p-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      runParse(active.id, active.fileName, passwords[active.id]);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <KeyRound className="mt-0.5 size-6 text-brand-600 dark:text-brand-300" aria-hidden />
                      <div>
                        <p className="font-semibold">Ce PDF est protégé par un mot de passe</p>
                        <p className="mt-1 text-sm text-muted">Le mot de passe est utilisé uniquement dans votre navigateur pour ouvrir le fichier.</p>
                      </div>
                    </div>
                    {active.passwordIncorrect ? <Alert tone="error">Mot de passe incorrect. Réessayez.</Alert> : null}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <label htmlFor={`pwd-${active.id}`} className="sr-only">Mot de passe du PDF</label>
                      <Input id={`pwd-${active.id}`} type="password" autoComplete="off" value={passwords[active.id] ?? ""} onChange={(e) => setPasswords((p) => ({ ...p, [active.id]: e.target.value }))} placeholder="Mot de passe du PDF" autoFocus />
                      <Button type="submit">Ouvrir</Button>
                    </div>
                  </form>
                ) : active.status === "error" ? (
                  <Alert tone="error" title="Ce fichier n'a pas pu être converti">
                    <p>{active.error}</p>
                    <p className="mt-2">
                      <Link href="/guides/releve-bancaire-scanne-pdf-image" className="font-semibold underline">
                        Que faire avec un relevé scanné ?
                      </Link>
                    </p>
                  </Alert>
                ) : st ? (
                  <>
                    <ReconciliationCard
                      key={`${active.id}-${st.openingBalance}-${st.closingBalance}`}
                      st={st}
                      onBalances={(o, c) => updateStatement(active.id, (s) => ({ ...s, openingBalance: o, closingBalance: c }))}
                    />
                    {st.warnings.length ? (
                      <details className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm">
                        <summary className="cursor-pointer font-medium">
                          {st.warnings.length} remarque{st.warnings.length > 1 ? "s" : ""} sur la lecture
                        </summary>
                        <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted">
                          {st.warnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                    <TransactionsTable st={st} onChange={(tx: Transaction[]) => updateStatement(active.id, (s) => ({ ...s, transactions: tx }))} />
                  </>
                ) : null}
              </section>
            ) : null}
          </div>

          {/* Export panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Export">
            <div className="surface grid gap-5 p-5">
              <div>
                <h2 className="font-bold">Exporter</h2>
                {account ? (
                  <p className="mt-1 text-sm text-muted" data-testid="quota">
                    {account.allowanceRemaining} page{account.allowanceRemaining > 1 ? "s" : ""} restante{account.allowanceRemaining > 1 ? "s" : ""} ce mois
                    {account.credits ? ` + ${account.credits} en crédit` : ""}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Compte gratuit requis pour télécharger.</p>
                )}
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold">Format</legend>
                <div className="grid gap-2">
                  {EXPORT_FORMATS.map((f) => {
                    const lockedFormat = !f.free && !(account?.paidFeatures ?? false);
                    return (
                      <label
                        key={f.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                          format === f.id ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/40" : "border-[var(--border)] hover:bg-[var(--bg-subtle)]",
                        )}
                      >
                        <input type="radio" name="format" value={f.id} checked={format === f.id} onChange={() => setFormat(f.id)} className="mt-0.5 accent-brand-600" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 font-semibold">
                            {f.label}
                            {lockedFormat ? <Lock className="size-3.5 text-subtle" aria-label="offre payante" /> : null}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-subtle">{f.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {parsed.length > 1 ? (
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Relevés à exporter</legend>
                  <div className="grid gap-2 text-sm">
                    {(
                      [
                        ["current", "Le relevé affiché uniquement"],
                        ["merge", `Les ${parsed.length} relevés fusionnés en un fichier`],
                        ["zip", `Les ${parsed.length} relevés, un fichier chacun (.zip)`],
                      ] as [Scope, string][]
                    ).map(([v, l]) => (
                      <label key={v} className="flex cursor-pointer items-center gap-2.5">
                        <input type="radio" name="scope" value={v} checked={scope === v} onChange={() => setScope(v)} className="accent-brand-600" />
                        <span>
                          {l}
                          {v !== "current" && !(account?.paidFeatures ?? false) ? <Lock className="ml-1.5 inline size-3.5 text-subtle" aria-label="offre payante" /> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {targets.some((d) => d.statement?.reconciliation.status === "mismatch") ? (
                <Alert tone="warning">Un relevé présente un écart de solde. Vous pouvez exporter, mais vérifiez les lignes signalées.</Alert>
              ) : null}

              <Button size="lg" className="w-full" onClick={doExport} loading={exporting} disabled={!targets.length || busy} icon={<Download className="size-5" aria-hidden />} data-testid="export-button">
                {locked ? "Débloquer et télécharger" : "Télécharger"}
              </Button>
              {targets.length ? (
                <p className="-mt-2 text-center text-xs text-subtle">
                  {pagesNeeded} page{pagesNeeded > 1 ? "s" : ""} · ré-export gratuit du même relevé ce mois-ci
                </p>
              ) : null}

              <div className="grid gap-2 border-t border-[var(--border)] pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="size-4" aria-hidden />}
                  disabled={!parsed.length}
                  onClick={() => {
                    if (!(account?.paidFeatures ?? false)) {
                      setPaywall("Le rapport de contrôle imprimable est inclus dans les offres payantes.");
                      return;
                    }
                    window.print();
                  }}
                >
                  Rapport de contrôle {account?.paidFeatures ? "" : "🔒"}
                </Button>
                <Button variant="ghost" size="sm" icon={<RotateCcw className="size-4" aria-hidden />} onClick={resetAll}>
                  Tout effacer
                </Button>
              </div>
            </div>
            {account && account.plan === "free" ? (
              <p className="mt-3 text-center text-xs text-subtle">
                Plan gratuit.{" "}
                <Link href="/tarifs" className="font-semibold text-brand-600 underline dark:text-brand-300">
                  Voir les offres
                </Link>
              </p>
            ) : null}
          </aside>
        </div>
      ) : (
        <div className="grid gap-4 text-sm text-muted sm:grid-cols-3">
          {[
            ["Relevés PDF « texte »", "téléchargés depuis votre banque en ligne (pas de scan)."],
            ["Contrôle au centime", "solde de départ + opérations = solde final."],
            ["Excel et CSV gratuits", "OFX, QIF, écritures et lots avec les offres payantes."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-[var(--border)] p-4">
              <p className="font-semibold text-[var(--fg)]">{t}</p>
              <p className="mt-1">{d}</p>
            </div>
          ))}
        </div>
      )}

      <ControlReport statements={parsed.map((d) => d.statement!)} />
      <AuthDialog open={authOpen} onClose={() => { setAuthOpen(false); pendingExport.current = false; }} onAuthenticated={resumeAfterAuth} />
      <VerifyDialog open={verifyOpen} email={account?.user.email} onClose={() => { setVerifyOpen(false); pendingExport.current = false; }} onVerified={resumeAfterVerify} />
      <PaywallDialog open={!!paywall} reason={paywall ?? ""} onClose={() => setPaywall(null)} onCheckout={checkout} />
      <ReportLayoutDialog open={reportOpen} onClose={() => setReportOpen(false)} statement={st} />
    </div>
  );
}

function StatusDot({ status }: { status: ParsedStatement["reconciliation"]["status"] }) {
  const label = status === "verified" ? "vérifié" : status === "mismatch" ? "écart" : "non vérifiable";
  return <span className={cn("size-2.5 shrink-0 rounded-full", status === "verified" ? "bg-emerald-500" : status === "mismatch" ? "bg-rose-500" : "bg-amber-500")} aria-label={label} role="img" />;
}

