import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "See the Yummibite restaurant and dining experience.",
};

export default function GalleryPage() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <p className="eyebrow text-accent">A glimpse around the table</p>
        <h1 className="mt-5 font-serif text-6xl sm:text-8xl">Gallery</h1>
        <p className="mt-6 max-w-xl leading-7 text-foreground/70">
          Yummibite’s own food, dining room and event photography will be added
          here when supplied.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["Food", "The dining room", "At the table"].map((item) => (
            <div key={item} className="flex min-h-64 flex-col justify-end rounded-3xl border border-dashed border-border bg-muted p-6">
              <span className="eyebrow text-accent">Photography to come</span>
              <h2 className="mt-3 font-serif text-2xl">{item}</h2>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
