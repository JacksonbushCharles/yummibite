import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(0).max(1000).default(0),
});

const itemSchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  priceMinor: z.number().int().min(0).max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const parsedCategory = categorySchema.safeParse(body);
  const parsedItem = itemSchema.safeParse(body);
  if (!parsedCategory.success && !parsedItem.success) {
    return NextResponse.json({ error: "Check menu details and try again." }, { status: 400 });
  }

  try {
    const database = getDatabase();
    if (parsedCategory.success) {
      const id = randomUUID();
      database.prepare(
        `INSERT INTO menu_categories (id, name, sort_order) VALUES (?, ?, ?)`,
      ).run(id, parsedCategory.data.name, parsedCategory.data.sortOrder);
      return NextResponse.json({ id }, { status: 201 });
    }
    if (!parsedItem.success) {
      return NextResponse.json({ error: "Check menu details and try again." }, { status: 400 });
    }

    const id = randomUUID();
    database.prepare(
      `INSERT INTO menu_items
         (id, category_id, name, description, price_minor, currency)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      parsedItem.data.categoryId,
      parsedItem.data.name,
      parsedItem.data.description,
      parsedItem.data.priceMinor,
      parsedItem.data.currency,
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Could not add menu data:", error);
    return NextResponse.json({ error: "Could not save menu data." }, { status: 503 });
  }
}
