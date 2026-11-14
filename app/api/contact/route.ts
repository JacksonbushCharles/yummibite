import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { incrementRateLimit } from "@/lib/db";
import { hasSameOrigin } from "@/lib/http";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  message: z.string().trim().min(5).max(3000),
});

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the message details and try again." }, { status: 400 });
  }

  const { RESEND_API_KEY, RESEND_FROM, CONTACT_EMAIL, BETTER_AUTH_SECRET } = process.env;
  if (!RESEND_API_KEY || !RESEND_FROM || !CONTACT_EMAIL || !BETTER_AUTH_SECRET) {
    return NextResponse.json(
      { error: "The restaurant’s message service is not configured yet. Please contact the restaurant directly." },
      { status: 503 },
    );
  }

  try {
    const address =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const key = `contact:${createHmac("sha256", BETTER_AUTH_SECRET).update(address).digest("hex")}`;
    if (await incrementRateLimit(key) > 5) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [CONTACT_EMAIL],
        reply_to: parsed.data.email,
        subject: `Website message from ${parsed.data.name}`,
        text: `From: ${parsed.data.name} (${parsed.data.email})\n\n${parsed.data.message}`,
      }),
    });
    if (!response.ok) {
      console.error("Resend rejected a contact message:", response.status);
      return NextResponse.json({ error: "The message could not be sent. Please try again later." }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Could not send contact message:", error);
    return NextResponse.json({ error: "The message could not be sent. Please try again later." }, { status: 503 });
  }
}
