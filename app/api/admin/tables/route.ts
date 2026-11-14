import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

const tableSchema = z.object({
  name: z.string().trim().min(1).max(40),
  capacity: z.number().int().min(1).max(30),
  section: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const parsed = tableSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the table details." }, { status: 400 });
  }

  try {
    const id = randomUUID();
    await getDatabase().query(
      `INSERT INTO restaurant_tables (id, name, capacity, section)
       VALUES ($1, $2, $3, $4)`,
      [id, parsed.data.name, parsed.data.capacity, parsed.data.section || null],
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Could not save restaurant table:", error);
    return NextResponse.json({ error: "Could not save the table." }, { status: 409 });
  }
}
