import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableReservationSlots } from "@/lib/reservations";
import { restaurantConfig } from "@/lib/restaurant-config";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.coerce.number().int().min(1).max(restaurantConfig.reservation.maxPartySize),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid date and party size." }, { status: 400 });
  }

  try {
    const slots = await getAvailableReservationSlots(
      parsed.data.date,
      parsed.data.partySize,
    );
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Could not check reservation availability:", error);
    return NextResponse.json(
      { error: "Availability is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
