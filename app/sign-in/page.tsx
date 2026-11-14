import { AuthPanel } from "@/components/auth-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const redirectTo = next === "/admin" ? "/admin" : "/account";

  return (
    <main className="mx-auto flex max-w-7xl items-center justify-center px-5 py-16 sm:px-8 lg:py-24">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 sm:p-10">
        <div className="eyebrow text-accent">Yummibite / Your account</div>
        <h1 className="mt-5 font-serif text-4xl">Welcome to Yummibite</h1>
        <p className="mt-4 text-sm leading-6 text-foreground/65">
          Sign in or create an account with your name and email.
        </p>
        <div className="mt-8">
          <AuthPanel
            redirectTo={redirectTo}
            googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
          />
        </div>
      </div>
    </main>
  );
}
