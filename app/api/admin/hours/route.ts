import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
      closeTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
      isClosed: z.boolean(),
    }),
  ).length(7),
});

export async function PUT(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const parsed = hoursSchema.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    new Set(parsed.data?.hours.map(({ dayOfWeek }) => dayOfWeek)).size !== 7 ||
    parsed.data?.hours.some(
      ({ openTime, closeTime, isClosed }) =>
        !isClosed && (!openTime || !closeTime || openTime >= closeTime),
    )
  ) {
    return NextResponse.json({ error: "Check opening hours and try again." }, { status: 400 });
  }

  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    for (const day of parsed.data.hours) {
      await client.query(
        `INSERT INTO restaurant_hours (day_of_week, open_time, close_time, is_closed)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (day_of_week) DO UPDATE SET
           open_time = EXCLUDED.open_time,
           close_time = EXCLUDED.close_time,
           is_closed = EXCLUDED.is_closed`,
        [
          day.dayOfWeek,
          day.isClosed ? null : day.openTime,
          day.isClosed ? null : day.closeTime,
          day.isClosed,
        ],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Could not save restaurant opening hours:", error);
    return NextResponse.json({ error: "Could not save opening hours." }, { status: 503 });
  } finally {
    client.release();
  }
}
