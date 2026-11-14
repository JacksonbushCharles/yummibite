import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yummibite",
  description: "Explore Yummibite, browse the menu and reserve a table.",
};

const image =
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=85";

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[78svh] overflow-hidden bg-olive">
        <img
          src={image}
          alt="Sample restaurant photograph; replace with Yummibite photography."
          className="absolute inset-0 h-full w-full object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/25 sm:to-transparent" />
        <div className="relative mx-auto flex min-h-[78svh] max-w-7xl items-end px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-28">
          <div className="max-w-3xl text-white">
            <p className="eyebrow text-white/75">A place at the table</p>
            <h1 className="mt-5 font-serif text-4xl leading-[0.98] min-[375px]:text-5xl sm:text-8xl">
              Good food.
              <br />
              Easy company.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Welcome to Yummibite. Come together over a meal, take your time,
              and make room for one more.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
              <Link href="/reservations" className="rounded-full bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-accent/90 sm:px-6">
                Reserve a table
              </Link>
              <Link href="/menu" className="rounded-full border border-white/65 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-6">
                Explore the menu
              </Link>
            </div>
            <p className="mt-5 text-xs text-white/65">Sample hero photography — replace with restaurant images.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:py-28">
        <div>
          <p className="eyebrow text-accent">A little about us</p>
          <h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
            A warm welcome, with room to make it your own.
          </h2>
          <p className="mt-6 max-w-lg leading-7 text-foreground/70">
            Yummibite is getting ready to welcome you. Our restaurant story,
            cooking philosophy and team details will be shared here once
            confirmed.
          </p>
          <Link href="/about" className="mt-7 inline-block border-b border-accent pb-1 text-sm font-semibold text-accent">
            Get to know Yummibite
          </Link>
        </div>
        <div className="relative min-h-[350px] overflow-hidden rounded-[2rem] bg-muted">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80"
            alt="Sample dining room photograph; replace with Yummibite photography."
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-4 py-2 text-xs">
            Sample image
          </span>
        </div>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow text-accent">At the table</p>
              <h2 className="mt-4 font-serif text-4xl sm:text-5xl">The menu is taking shape.</h2>
            </div>
            <Link href="/menu" className="text-sm font-semibold text-accent underline underline-offset-4">
              See the menu
            </Link>
          </div>
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 sm:p-12">
            <p className="max-w-2xl leading-7 text-foreground/70">
              We’ll publish dishes, descriptions and prices here when the
              restaurant’s menu has been confirmed. No sample dishes or prices
              are presented as actual offerings.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 md:items-center lg:py-24">
        <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-muted">
          <img
            src="https://images.unsplash.com/photo-1515003197210-e0cd7184f8b5?auto=format&fit=crop&w=1400&q=80"
            alt="Sample food photograph; replace with Yummibite photography."
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-4 py-2 text-xs">
            Sample image
          </span>
        </div>
        <div className="md:pl-8">
          <p className="eyebrow text-accent">Come by</p>
          <h2 className="mt-4 font-serif text-4xl sm:text-5xl">Your table is waiting.</h2>
          <p className="mt-5 leading-7 text-foreground/70">
            Opening hours and location details will be updated as soon as they
            are confirmed. Reservation times shown online reflect the
            restaurant’s configured availability.
          </p>
          <Link href="/reservations" className="mt-8 inline-flex rounded-full bg-olive px-6 py-4 text-sm font-semibold text-cream transition hover:bg-olive/90">
            Find a time
          </Link>
        </div>
      </section>
    </main>
  );
}
