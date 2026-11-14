"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function AccountNavigation() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="whitespace-nowrap rounded-full border border-border px-3 py-2.5 text-xs font-medium transition hover:border-accent hover:text-accent sm:px-4 sm:text-sm"
      >
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      aria-label={`Your account: ${session.user.name}, ${session.user.email}`}
      className="max-w-40 truncate text-right text-sm transition hover:text-accent sm:max-w-56"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-full border-2 border-accent p-0.5">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-accent/10 font-semibold">
              {session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          )}
        </span>

        <span className="min-w-0 text-right max-[400px]:hidden md:hidden">
          <span className="block truncate font-medium">{session.user.name}</span>
          <span className="hidden truncate text-xs text-foreground/60 sm:block">
            {session.user.email}
          </span>
        </span>
    </div>
    </Link>
  );
}
