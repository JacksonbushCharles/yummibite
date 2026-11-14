import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

const statusSchema = z.object({
  status: z.enum(["confirmed", "seated", "completed", "cancelled", "no_show"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid reservation status." }, { status: 400 });
  }

  const result = await getDatabase().query(
    `UPDATE reservations SET status = $1, updated_at = now()::text
     WHERE id = $2`,
    [parsed.data.status, id],
  );
  if (!result.rowCount) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
