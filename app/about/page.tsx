import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our story",
  description: "Learn about Yummibite and the restaurant experience.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-accent">Our story</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight sm:text-7xl">
            A story still being written.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-foreground/70">
            The people, place and culinary point of view behind Yummibite will
            be introduced here once the restaurant shares its story.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 lg:py-28">
        <div>
          <p className="eyebrow text-accent">Our approach</p>
          <h2 className="mt-4 font-serif text-4xl">Made personal, not assumed.</h2>
        </div>
        <div className="space-y-5 leading-7 text-foreground/70">
          <p>
            We’re preparing a place for people to gather. Details about our
            team, ingredients, menu and dining room will be added when confirmed.
          </p>
          <p>
            Until then, this page stays honest about what is still to come,
            rather than inventing a restaurant history or promises.
          </p>
          <Link href="/reservations" className="inline-block font-semibold text-accent underline underline-offset-4">
            Reserve a table
          </Link>
        </div>
      </section>
    </main>
  );
}
