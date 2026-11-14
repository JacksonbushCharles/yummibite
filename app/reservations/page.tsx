import type { Metadata } from "next";
import { ReservationForm } from "@/components/reservation-form";

export const metadata: Metadata = {
  title: "Reservations",
  description: "Request a Yummibite table reservation.",
  robots: { index: false, follow: false },
};

export default function ReservationsPage() {
  return (
    <main>
      <section className="bg-olive text-cream">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="eyebrow text-cream/60">Make it a date</p>
          <h1 className="mt-5 font-serif text-5xl sm:text-7xl">Join us at the table.</h1>
          <p className="mt-5 max-w-xl leading-7 text-cream/75">
            Reservation requests are checked against the restaurant’s opening
            hours and table availability.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
        <ReservationForm />
      </section>
    </main>
  );
}
