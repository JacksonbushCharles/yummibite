import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin-controls";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?next=/account");

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8 lg:py-24">
      <div className="rounded-3xl border border-border bg-card p-7 sm:p-10">
        <p className="eyebrow text-accent">Yummibite / Your account</p>
        <h1 className="mt-5 font-serif text-4xl">Welcome, {session.user.name}.</h1>
        <p className="mt-4 leading-7 text-foreground/65">
          You’re signed in with your Yummibite account.
        </p>

        <dl className="mt-8 divide-y divide-border rounded-2xl border border-border">
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="text-sm text-foreground/60">Name</dt>
            <dd className="break-words text-sm font-medium">{session.user.name}</dd>
          </div>
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="text-sm text-foreground/60">Email</dt>
            <dd className="break-words text-sm font-medium">{session.user.email}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/reservations"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Reserve a table
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
