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

  const database = getDatabase();
  const saveHours = database.transaction((hours: typeof parsed.data.hours) => {
    const upsert = database.prepare(
      `INSERT INTO restaurant_hours (day_of_week, open_time, close_time, is_closed)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (day_of_week) DO UPDATE SET
         open_time = excluded.open_time,
         close_time = excluded.close_time,
         is_closed = excluded.is_closed`,
    );
    for (const day of hours) {
      upsert.run(
        day.dayOfWeek,
        day.isClosed ? null : day.openTime,
        day.isClosed ? null : day.closeTime,
        Number(day.isClosed),
      );
    }
  });
  try {
    saveHours(parsed.data.hours);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not save restaurant opening hours:", error);
    return NextResponse.json({ error: "Could not save opening hours." }, { status: 503 });
  }
}
