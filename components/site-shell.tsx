import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";

const links = [
  { href: "/about", label: "Our story" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-5 sm:px-8 sm:py-4">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
            Yummibite<span className="text-accent">.</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-foreground/75 transition hover:text-accent">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-5">
            <AccountNavigation />
            <Link
              href="/reservations"
              className="whitespace-nowrap rounded-full bg-accent px-3 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-accent/90 sm:px-5 sm:text-xs"
            >
              <span className="sm:hidden">Reserve</span>
              <span className="hidden sm:inline">Reserve a table</span>
            </Link>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className="flex justify-center gap-4 overflow-x-auto border-t border-border px-3 py-3 text-xs md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap text-foreground/70">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
      <footer className="border-t border-border bg-olive text-cream">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
          <div>
            <Link href="/" className="font-serif text-3xl">Yummibite</Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-cream/70">
              A welcoming place for good food and good company.
            </p>
          </div>
          <div>
            <p className="eyebrow text-cream/55">Find us</p>
            <p className="mt-3 text-sm text-cream/80">Restaurant address to be confirmed</p>
            <Link href="/contact" className="mt-2 inline-block text-sm text-cream underline underline-offset-4">Contact details</Link>
          </div>
          <div className="md:text-right">
            <p className="eyebrow text-cream/55">A place at the table</p>
            <Link href="/reservations" className="mt-4 inline-block text-sm text-cream underline underline-offset-4">
              Make a reservation
            </Link>
          </div>
        </div>
        <div className="border-t border-cream/15 px-5 py-4 text-center text-xs text-cream/55">
          © {new Date().getFullYear()} Yummibite
        </div>
      </footer>
    </div>
  );
}
