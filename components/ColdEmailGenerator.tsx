"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { GenerateEmailResponse } from "@/app/api/generate/route";
import type { UsageResponse } from "@/app/api/usage/route";
import { USAGE_LIMIT_MESSAGE } from "@/lib/usage";

type FormState = {
  name: string;
  company: string;
  recipientDescription: string;
};

const initialForm: FormState = {
  name: "",
  company: "",
  recipientDescription: "",
};

export function ColdEmailGenerator() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<GenerateEmailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  const limitReached = usage?.limit_reached ?? false;

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) return;
      const data = (await res.json()) as UsageResponse;
      setUsage(data);
    } catch {
      // Nutzungsanzeige ist optional – Generierung bleibt über die API geschützt.
    }
  }, []);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (searchParams.get("upgraded") !== "1") return;

    setUpgradeSuccess(true);
    window.history.replaceState({}, "", "/");

    const poll = async () => {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const res = await fetch("/api/usage");
        if (!res.ok) continue;
        const data = (await res.json()) as UsageResponse;
        if (data.is_pro) {
          setUsage(data);
          return;
        }
      }
      void fetchUsage();
    };

    void poll();
  }, [searchParams, fetchUsage]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as GenerateEmailResponse & {
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Ein Fehler ist aufgetreten.");
        return;
      }

      setResult({ subject: data.subject, body: data.body });
      void fetchUsage();
    } catch {
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Upgrade konnte nicht gestartet werden.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Netzwerkfehler. Bitte später erneut versuchen.");
    } finally {
      setUpgrading(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;

    const text = `Betreff: ${result.subject}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fullEmail = result
    ? `Betreff: ${result.subject}\n\n${result.body}`
    : "";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <p className="mb-2 text-sm font-medium tracking-wide text-[var(--accent)] uppercase">
          KI-gestützt
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cold Email Generator
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Beschreibe deinen Empfänger – wir schreiben eine personalisierte
          Erstnachricht für dich.
        </p>
        {usage?.is_pro && (
          <p className="mt-2 text-sm font-medium text-[var(--accent)]">
            Pro – unbegrenzte E-Mails
          </p>
        )}
        {usage && !usage.is_pro && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {usage.remaining === 0
              ? "Keine kostenlosen E-Mails mehr übrig."
              : `${usage.remaining} von ${usage.free_limit} kostenlosen E-Mails übrig`}
          </p>
        )}
        {upgradeSuccess && usage?.is_pro && (
          <p className="mt-2 text-sm font-medium text-emerald-400">
            Upgrade erfolgreich! Du kannst jetzt unbegrenzt E-Mails generieren.
          </p>
        )}
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Dein Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="z. B. Anna Müller"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Deine Firma
            </label>
            <input
              id="company"
              type="text"
              required
              autoComplete="organization"
              placeholder="z. B. Acme Solutions GmbH"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>

          <div>
            <label
              htmlFor="recipient"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Beschreibung des Empfängers
            </label>
            <textarea
              id="recipient"
              required
              rows={5}
              placeholder="z. B. CTO eines mittelständischen SaaS-Unternehmens mit 80 Mitarbeitern, sucht gerade nach besserer Datenanalyse für das Sales-Team …"
              value={form.recipientDescription}
              onChange={(e) =>
                updateField("recipientDescription", e.target.value)
              }
              className="w-full resize-y rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Je konkreter die Beschreibung, desto personalisierter die E-Mail.
            </p>
          </div>
        </div>

        {(error || limitReached) && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          >
            <p>{limitReached ? USAGE_LIMIT_MESSAGE : error}</p>
            {limitReached && (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {upgrading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Weiterleitung zu Stripe …
                  </>
                ) : (
                  "Upgrade auf Pro"
                )}
              </button>
            )}
          </div>
        )}

        {!limitReached && (
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                E-Mail wird generiert …
              </>
            ) : (
              "Cold Email generieren"
            )}
          </button>
        )}
      </form>

      {result && (
        <section
          className="animate-fade-in mt-8 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8"
          aria-live="polite"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Deine E-Mail</h2>
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {copied ? "Kopiert!" : "In Zwischenablage kopieren"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                Betreff
              </p>
              <p className="rounded-lg bg-[var(--background)] px-4 py-3 font-medium">
                {result.subject}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                Nachricht
              </p>
              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--background)] px-4 py-3 font-sans text-sm leading-relaxed">
                {result.body}
              </pre>
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              Vorschau als Plain Text
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-4 text-xs text-[var(--muted)]">
              {fullEmail}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
