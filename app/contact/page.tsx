import type { Metadata } from "next";
import ContactClient from "@/components/contact/ContactClient";
import StoreFooter from "@/components/layout/StoreFooter";

export const metadata: Metadata = {
  title: "Contact & Concierge — Lekki Atelier | Blacko Stores",
  description:
    "Connect with Blacko Stores in Lekki, Lagos. Track your custom Weekender order, speak with our tailor on WhatsApp, or send an inquiry directly to our cutting room.",
};

export default function ContactPage() {
  return (
    <main className="w-full bg-[#F9F8F6] text-[#141413]">
      {/* Editorial Header */}
      <section className="pt-20 md:pt-28 pb-12 md:pb-16 px-6 md:px-12 max-w-6xl mx-auto border-b border-[var(--hairline)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-3">
          CONTACT &amp; CLIENT CONCIERGE
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal leading-tight tracking-tight text-[#141413]">
          Connect With The Atelier.
        </h1>
        <p className="mt-4 text-base md:text-lg text-[var(--ink-muted)] leading-relaxed font-sans max-w-2xl">
          Whether inquiring about a small-batch drop, custom sizing specs, or tracking your
          Weekender delivery across Lagos and worldwide, we are here to assist.
        </p>
      </section>

      {/* Interactive Contact & Order Tracking Body */}
      <section className="py-14 md:py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <ContactClient />
      </section>

      {/* Shared Store Footer */}
      <div className="pb-24">
        <StoreFooter />
      </div>
    </main>
  );
}
