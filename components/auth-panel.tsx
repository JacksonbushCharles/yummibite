"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthPanel({
  redirectTo,
  googleEnabled,
}: {
  redirectTo: "/account" | "/admin";
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      if (result.error) {
        setError("Google sign-in could not be started. Please try again.");
      }
    } catch (signInError) {
      console.error("Could not start Google sign-in:", signInError);
      setError("Google sign-in could not be completed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const email = String(form.get("email")).trim();
      const password = String(form.get("password"));
      const result = mode === "sign-in"
        ? await authClient.signIn.email({ email, password, callbackURL: redirectTo })
        : await authClient.signUp.email({
            name: String(form.get("name")).trim(),
            email,
            password,
            callbackURL: redirectTo,
          });
      if (result.error) {
        setError(
          mode === "sign-in"
            ? "Sign in failed. Check your email and password, then try again."
            : "Your account could not be created. Check your details or try signing in.",
        );
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch (signInError) {
      console.error("Could not sign in:", signInError);
      setError("Sign in could not be completed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={pending}
            className="w-full rounded-full border border-border px-6 py-4 text-sm font-semibold transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {pending ? "Connecting to Google…" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-4 text-xs text-foreground/50">
            <span className="h-px flex-1 bg-border" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="space-y-5">
        {mode === "sign-up" && (
          <label className="block text-sm">
            Your name
            <input name="name" type="text" autoComplete="name" minLength={2} maxLength={100} required className="form-input mt-2" />
          </label>
        )}
        <label className="block text-sm">
          Email
          <input name="email" type="email" autoComplete="username" required className="form-input mt-2" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required className="form-input mt-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
        <button disabled={pending} className="w-full rounded-full bg-accent px-6 py-4 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? (mode === "sign-in" ? "Signing in…" : "Creating account…") : (mode === "sign-in" ? "Sign in" : "Create account")}
        </button>
        <p className="text-center text-sm text-foreground/65">
          {mode === "sign-in" ? "New to Yummibite?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError("");
            }}
            className="font-semibold text-accent underline underline-offset-4"
          >
            {mode === "sign-in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </div>
  );
}
