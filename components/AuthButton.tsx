"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/client";

type Mode = "closed" | "panel" | "sent";

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("closed");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) return;

    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInGoogle = useCallback(async () => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
  }, []);

  const sendLink = useCallback(async () => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    const clean = address.trim();
    if (!clean.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (otpError) setError(otpError.message);
    else setMode("sent");
  }, [address]);

  const signOut = useCallback(async () => {
    const supabase = supabaseBrowser();
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
    setMode("closed");
  }, []);

  if (!isSupabaseConfigured()) return null;

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[140px] truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-black/5 sm:block">
          {email}
        </span>
        <button
          onClick={() => void signOut()}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-black/5 transition hover:bg-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMode(mode === "closed" ? "panel" : "closed")}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-50"
        aria-expanded={mode !== "closed"}
      >
        Sign in
      </button>

      {mode !== "closed" && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5">
          {mode === "sent" ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Check your inbox</p>
              <p className="text-xs leading-relaxed text-slate-500">
                We sent a sign-in link to <strong>{address.trim()}</strong>. Open
                it on this device.
              </p>
              <button
                onClick={() => setMode("panel")}
                className="text-xs font-semibold text-brand-600"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Save your progress
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Optional. Sign in to keep your diagnostic scores and camera
                  doubts. Only you can read them.
                </p>
              </div>

              <button
                onClick={() => void signInGoogle()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <span aria-hidden>🔵</span> Continue with Google
              </button>

              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                <div className="h-px flex-1 bg-slate-200" /> or email
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <input
                type="email"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                maxLength={120}
              />
              <button
                onClick={() => void sendLink()}
                disabled={busy}
                className="w-full rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Email me a sign-in link"}
              </button>

              {error && <p className="text-xs text-rose-600">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
