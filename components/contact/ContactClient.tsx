"use client";

import React, { useState } from "react";

interface OrderTrackingResult {
  reference: string;
  status: string;
  totalKobo: number;
  deliveryCity: string;
  createdAt: string;
}

const SUBJECT_OPTIONS = [
  "Sizing & Fit",
  "Order Inquiry",
  "Bulk / Private Styling",
  "General Atelier",
];

export default function ContactClient() {
  // --- Form State ---
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: SUBJECT_OPTIONS[0],
    message: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Order Tracking State ---
  const [orderRef, setOrderRef] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<OrderTrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccessMessage(null);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError("Please fill out all required fields.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit message.");
      }

      setFormSuccessMessage(data.message || "Message received. Our Lagos studio will reply within 24 hours.");
      setForm({
        name: "",
        email: "",
        subject: SUBJECT_OPTIONS[0],
        message: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send message right now.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleTrackOrder(e: React.FormEvent) {
    e.preventDefault();
    setTrackingError(null);
    setTrackedOrder(null);

    const trimmed = orderRef.trim();
    if (!trimmed) {
      setTrackingError("Please enter your order reference (e.g. BLK-LAG-849201).");
      return;
    }

    setTrackingLoading(true);
    try {
      const res = await fetch(`/api/orders/track?ref=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        throw new Error(data.error || "Order reference not found.");
      }

      setTrackedOrder(data.order);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error querying order tracking.";
      setTrackingError(msg);
    } finally {
      setTrackingLoading(false);
    }
  }

  function formatStatus(status: string) {
    switch (status.toUpperCase()) {
      case "IN_ATELIER":
        return { label: "In Atelier / Cutting", color: "bg-amber-100 text-amber-900 border-amber-300" };
      case "PAID":
        return { label: "Payment Confirmed", color: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "DISPATCHED":
        return { label: "Dispatched / En Route", color: "bg-blue-100 text-blue-900 border-blue-300" };
      case "DELIVERED":
        return { label: "Delivered", color: "bg-neutral-900 text-neutral-100 border-neutral-900" };
      case "PENDING":
        return { label: "Pending Payment", color: "bg-neutral-100 text-neutral-800 border-neutral-300" };
      default:
        return { label: status, color: "bg-neutral-100 text-neutral-800 border-neutral-300" };
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      {/* LEFT COLUMN: Atelier Info + WhatsApp + Order Tracking */}
      <div className="lg:col-span-5 flex flex-col gap-10">
        {/* Studio Details */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-3">
            LEKKI FLAGSHIP ATELIER
          </p>
          <h2 className="font-serif text-3xl text-[#141413] mb-4">
            Visit Our Cutting Room
          </h2>
          <div className="text-sm text-[var(--ink-muted)] leading-relaxed space-y-2 font-sans">
            <p className="text-[#141413] font-medium">Blacko Stores Studio</p>
            <p>Plot 14, Admiralty Way</p>
            <p>Lekki Phase 1, Lagos, Nigeria</p>
            <p className="pt-2">
              <span className="font-mono text-xs text-[#141413] block">HOURS:</span>
              Monday – Saturday: 10:00 AM – 7:00 PM WAT
            </p>
            <p>Sunday: Closed for fabric sourcing</p>
          </div>
        </div>

        {/* WhatsApp Direct Concierge Link */}
        <div className="p-5 bg-[#F2EFE9] border border-[var(--hairline)] rounded-sm">
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#141413] font-medium mb-1">
            DIRECT ATELIER CONCIERGE
          </p>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4">
            Need urgent sizing advice or same-day dispatch across Lagos Island &amp; Mainland?
            Speak directly with our tailor on WhatsApp.
          </p>
          <a
            href="https://wa.me/2348140002910?text=Hello%20Blacko%20Stores%20Atelier,%20I%20would%20like%20to%20inquire%20about%20a%20shirting%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 shop-primary text-xs font-mono uppercase tracking-[0.16em] transition"
          >
            <span>💬 WhatsApp Concierge</span>
            <span className="text-[10px] opacity-70">(+234 814 000 2910)</span>
          </a>
        </div>

        {/* Live Order Tracker */}
        <div className="p-6 bg-white border border-[var(--hairline)] rounded-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#141413] font-medium">
              LIVE ORDER TRACKING
            </p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-[var(--ink-muted)] mb-4 leading-relaxed">
            Enter your Paystack order reference from your receipt or confirmation email.
          </p>

          <form onSubmit={handleTrackOrder} className="flex flex-col gap-3">
            <div className="flex items-stretch gap-2">
              <input
                type="text"
                placeholder="BLK-LAG-849201"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-mono tracking-wider border border-[var(--hairline)] focus:outline-none focus:border-[#141413] uppercase bg-[#FAF9F7]"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-4 py-2 shop-primary text-xs font-mono uppercase tracking-wider transition disabled:opacity-50"
              >
                {trackingLoading ? "Locating..." : "Track"}
              </button>
            </div>
            <p className="text-[10px] font-mono text-[var(--ink-muted)]">
              Example reference: <span className="underline cursor-pointer" onClick={() => setOrderRef("BLK-LAG-849201")}>BLK-LAG-849201</span>
            </p>
          </form>

          {/* Tracking Result Card */}
          {trackedOrder && (
            <div className="mt-5 pt-4 border-t border-[var(--hairline)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--ink-muted)]">STATUS:</span>
                <span
                  className={
                    "font-mono text-[11px] px-2 py-0.5 border rounded-sm font-medium " +
                    formatStatus(trackedOrder.status).color
                  }
                >
                  {formatStatus(trackedOrder.status).label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--ink-muted)]">REFERENCE:</span>
                <span className="font-mono font-medium text-[#141413]">
                  {trackedOrder.reference}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--ink-muted)]">DESTINATION:</span>
                <span className="font-medium text-[#141413]">
                  {trackedOrder.deliveryCity}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--ink-muted)]">TOTAL:</span>
                <span className="font-mono font-medium text-[#141413]">
                  ₦{(trackedOrder.totalKobo / 100).toLocaleString("en-NG")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[var(--ink-muted)]">ORDER DATE:</span>
                <span className="font-mono text-[var(--ink-muted)]">
                  {new Date(trackedOrder.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Tracking Error Message */}
          {trackingError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
              ✕ {trackingError}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Studio Inquiry Form */}
      <div className="lg:col-span-7 bg-[#F7F5F0] p-6 sm:p-8 md:p-10 border border-[var(--hairline)] rounded-sm">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--ink-muted)] mb-2">
          INQUIRIES &amp; CUSTOM ORDERS
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-[#141413] mb-4">
          Send a Studio Message
        </h2>
        <p className="text-sm text-[var(--ink-muted)] leading-relaxed mb-8 font-sans">
          Whether you need bespoke size adjustments, bridal party shirting, or have questions
          regarding our textile provenance, our Lekki studio team will get back to you promptly.
        </p>

        {formSuccessMessage && (
          <div className="mb-6 p-4 bg-[#141413] text-[#F9F8F6] text-xs font-mono tracking-wider rounded-sm flex items-center justify-between">
            <span>✓ {formSuccessMessage}</span>
            <button
              onClick={() => setFormSuccessMessage(null)}
              className="text-white/60 hover:text-white text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono rounded-sm">
            ✕ {formError}
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#141413] mb-2 font-medium">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tunde Adeyemi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-sans border border-[var(--hairline)] focus:outline-none focus:border-[#141413] bg-white rounded-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#141413] mb-2 font-medium">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="tunde@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-sans border border-[var(--hairline)] focus:outline-none focus:border-[#141413] bg-white rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#141413] mb-2 font-medium">
              Inquiry Subject *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUBJECT_OPTIONS.map((sub) => {
                const isSelected = form.subject === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setForm({ ...form, subject: sub })}
                    className={
                      "py-2 px-2 text-[11px] font-mono tracking-tight text-center border transition " +
                      (isSelected
                        ? "shop-primary border-[var(--accent-button)]"
                        : "bg-white text-[var(--ink-muted)] border-[var(--hairline)] hover:border-[#141413]")
                    }
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-[#141413] mb-2 font-medium">
              Message *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Tell us what you're looking for, sizing questions, or styling requests..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs font-sans border border-[var(--hairline)] focus:outline-none focus:border-[#141413] bg-white rounded-none resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 shop-primary text-xs font-medium uppercase tracking-[0.2em] transition disabled:opacity-50"
          >
            {formSubmitting ? "Transmitting to Atelier..." : "Transmit Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
