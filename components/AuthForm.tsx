"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setMessage(
          "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse, falls du eine Bestätigungsmail erhalten hast.",
        );
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <header className="mb-8 text-center">
        <p className="mb-2 text-sm font-medium tracking-wide text-[var(--accent)] uppercase">
          Cold Email Generator
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === "login" ? "Anmelden" : "Registrieren"}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {mode === "login"
            ? "Melde dich an, um Cold Emails zu generieren."
            : "Erstelle ein Konto, um loszulegen."}
        </p>
      </header>

      <div className="mb-6 flex rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setError(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Registrieren
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-xl sm:p-8"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 px-4 py-3 text-sm text-[var(--error)]"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-4 rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)]"
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Bitte warten …
            </>
          ) : mode === "login" ? (
            "Anmelden"
          ) : (
            "Konto erstellen"
          )}
        </button>
      </form>
    </div>
  );
}
