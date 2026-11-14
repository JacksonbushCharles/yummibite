import type { Metadata } from "next";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { menuCategories, menuItems } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Menu",
  description: "Browse the Yummibite menu.",
};

export default async function MenuPage() {
  await connection();
  const rows = await getDb()
    .select({
      categoryId: menuCategories.id,
      categoryName: menuCategories.name,
      categoryOrder: menuCategories.sortOrder,
      itemId: menuItems.id,
      itemName: menuItems.name,
      description: menuItems.description,
      priceMinor: menuItems.priceMinor,
      currency: menuItems.currency,
      imageUrl: menuItems.imageUrl,
    })
    .from(menuCategories)
    .leftJoin(
      menuItems,
      and(
        eq(menuItems.categoryId, menuCategories.id),
        eq(menuItems.isAvailable, true),
      ),
    )
    .where(eq(menuCategories.isVisible, true))
    .orderBy(asc(menuCategories.sortOrder), asc(menuItems.sortOrder));

  const categories = new Map<string, {
    name: string;
    items: Array<{
      id: string;
      name: string;
      description: string;
      priceMinor: number;
      currency: string;
    }>;
  }>();
  for (const row of rows) {
    const category = categories.get(row.categoryId) ?? { name: row.categoryName, items: [] };
    if (row.itemId) {
      category.items.push({
        id: row.itemId,
        name: row.itemName!,
        description: row.description!,
        priceMinor: row.priceMinor!,
        currency: row.currency!,
      });
    }
    categories.set(row.categoryId, category);
  }

  return (
    <main>
      <section className="bg-olive text-cream">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-cream/60">From our kitchen</p>
          <h1 className="mt-5 font-serif text-6xl sm:text-8xl">The menu</h1>
          <p className="mt-6 max-w-xl leading-7 text-cream/75">
            Dishes and prices will appear here after the restaurant confirms
            them. The menu is managed from the private restaurant dashboard.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-24">
        {categories.size === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center sm:p-16">
            <p className="eyebrow text-accent">Menu in progress</p>
            <h2 className="mt-4 font-serif text-3xl">We’ll share the menu soon.</h2>
            <p className="mx-auto mt-4 max-w-lg leading-7 text-foreground/65">
              No sample dishes or prices are shown as real offerings. Please
              check back once the Yummibite menu is confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {[...categories.entries()].map(([id, category]) => (
              <section key={id}>
                <h2 className="border-b border-border pb-4 font-serif text-3xl">
                  {category.name}
                </h2>
                <div className="divide-y divide-border">
                  {category.items.map((item) => (
                    <article key={item.id} className="flex items-start justify-between gap-6 py-6">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-foreground/65">{item.description}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: item.currency,
                        }).format(item.priceMinor / 100)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
