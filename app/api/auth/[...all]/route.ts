import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);

export function GET(request: Request) {
  return handlers.GET(request);
}

export function POST(request: Request) {
  return handlers.POST(request);
}

export function PUT(request: Request) {
  return handlers.PUT(request);
}

export function PATCH(request: Request) {
  return handlers.PATCH(request);
}

export function DELETE(request: Request) {
  return handlers.DELETE(request);
}
