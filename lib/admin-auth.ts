import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getAdminSession() {
  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowedEmail) return null;

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.email.toLowerCase() !== allowedEmail) return null;
  return session;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/sign-in?next=/admin");
  return session;
}
