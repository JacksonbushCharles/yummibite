import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { incrementRateLimit } from "@/lib/db";
import { hasSameOrigin } from "@/lib/http";
import { createReservation } from "@/lib/reservations";
import { restaurantConfig } from "@/lib/restaurant-config";

const reservationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[\d\s().-]{7,24}$/),
  email: z.email().max(254),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  partySize: z.number().int().min(1).max(restaurantConfig.reservation.maxPartySize),
  specialRequests: z.string().trim().max(1000).optional(),
  occasion: z.string().trim().max(80).optional(),
});

async function checkRateLimit(request: Request) {
  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET must be set to rate-limit reservations.");

  const key = createHmac("sha256", secret).update(address).digest("hex");
  return incrementRateLimit(key) <= 8;
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Submit a valid reservation request." }, { status: 400 });
  }
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the reservation details and try again." },
      { status: 400 },
    );
  }

  try {
    if (!(await checkRateLimit(request))) {
      return NextResponse.json(
        { error: "Too many booking attempts. Please try again later." },
        { status: 429 },
      );
    }

    const reservation = await createReservation(parsed.data);
    if (!reservation) {
      return NextResponse.json(
        { error: "That time is no longer available. Choose another time." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        reference: reservation.reference,
        startsAt: reservation.startsAt.toISOString(),
        status: "pending",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not create reservation:", error);
    return NextResponse.json(
      { error: "Your reservation could not be completed. Please try again." },
      { status: 503 },
    );
  }
}
