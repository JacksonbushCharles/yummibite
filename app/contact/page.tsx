import type { Metadata } from "next";
import { restaurantConfig } from "@/lib/restaurant-config";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Yummibite for restaurant and reservation questions.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <p className="eyebrow text-accent">Get in touch</p>
          <h1 className="mt-5 font-serif text-6xl sm:text-8xl">Contact</h1>
          <p className="mt-6 max-w-xl leading-7 text-foreground/70">
            Restaurant contact details will be updated once confirmed.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
        <div className="space-y-8">
          <div>
            <p className="eyebrow text-accent">Visit</p>
            <p className="mt-3 text-lg">{restaurantConfig.contact.address}</p>
          </div>
          <div>
            <p className="eyebrow text-accent">Call or email</p>
            <p className="mt-3">{restaurantConfig.contact.phone}</p>
            <p className="mt-2">{restaurantConfig.contact.email}</p>
          </div>
          <div>
            <p className="eyebrow text-accent">Opening hours</p>
            <p className="mt-3">{restaurantConfig.openingHours}</p>
          </div>
          <p className="text-sm leading-6 text-foreground/60">
            The map, social links and contact form will be connected once the
            restaurant’s official details are available.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
