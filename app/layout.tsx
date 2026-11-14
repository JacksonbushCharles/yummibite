import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: {
    default: "Yummibite",
    template: "%s | Yummibite",
  },
  description: "Yummibite restaurant information, menu and table reservations.",
  openGraph: {
    title: "Yummibite",
    description: "Restaurant information, menu and table reservations.",
    siteName: "Yummibite",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yummibite",
    description: "Restaurant information, menu and table reservations.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full bg-background text-foreground">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
