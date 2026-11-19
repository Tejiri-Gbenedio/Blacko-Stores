"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useBag } from "@/components/bag/BagContext";

export default function StoreFooter() {
  const { setDrawerOpen } = useBag();
  const [vipEmail, setVipEmail] = useState("");
  const [vipSubmitted, setVipSubmitted] = useState(false);

  function handleVipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vipEmail || !vipEmail.includes("@")) return;
    setVipSubmitted(true);
  }

  return (
    <footer
      id="footer"
      className="w-full bg-[#F7F5F0] border-t border-[var(--hairline)] pt-16 pb-12 px-6 md:px-12 text-[#141413]"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 pb-14 border-b border-[var(--hairline)]">
        {/* Column 1: Brand & Manifesto */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <Link
              href="/"
              className="text-base font-semibold tracking-[0.28em] uppercase text-[#141413] hover:opacity-75 transition inline-block"
            >
              BLACKO STORES
            </Link>
            <p className="mt-3 text-xs md:text-sm text-[var(--ink-muted)] leading-relaxed max-w-sm">
              Handcrafted shirting engineered in Lagos, Nigeria. Small-batch tailoring woven from heritage African jacquard, hand-resist adire, and breathable raw cotton.
            </p>
          </div>
          <p className="font-mono text-[11px] text-[var(--ink-muted)] mt-6">
            © {new Date().getFullYear()} Blacko Stores Ltd. All rights reserved.
          </p>
        </div>

        {/* Column 2: Lagos Studio Hours & Quick Links */}
        <div className="md:col-span-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#141413] font-medium mb-3">
            LEKKI ATELIER
          </p>
          <div className="text-xs text-[var(--ink-muted)] space-y-1.5 leading-relaxed font-sans">
            <p>Plot 14, Admiralty Way</p>
            <p>Lekki Phase 1, Lagos, Nigeria</p>
            <p className="pt-2 font-mono text-[11px] text-[#141413]">
              Mon–Sat, 10am–7pm WAT
            </p>
            <p className="text-[11px]">Nationwide Dispatch: 24–48 hrs</p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/"
              className="text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
            >
              Shop All
            </Link>
            <Link
              href="/about"
              className="text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
            >
              About &amp; Craft
            </Link>
            <Link
              href="/contact"
              className="text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
            >
              Contact &amp; Concierge
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-left text-xs uppercase tracking-wider text-[var(--ink-muted)] hover:text-[#141413] transition"
            >
              Custom Bag Drawer
            </button>
          </div>
        </div>

        {/* Column 3: VIP Private Drop List */}
        <div className="md:col-span-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#141413] font-medium mb-2">
            PRIVATE DROP LIST
          </p>
          <p className="text-xs text-[var(--ink-muted)] leading-relaxed mb-4">
            Receive private reservation links 1 hour before small-batch seasonal releases open publicly.
          </p>

          {vipSubmitted ? (
            <div className="p-3 bg-[#141413] text-[#F9F8F6] text-xs font-mono tracking-wider rounded-sm">
              ✓ You&apos;re on the private drop list. Check your inbox.
            </div>
          ) : (
            <form
              onSubmit={handleVipSubmit}
              className="flex items-center border border-[#141413]/25 bg-white p-1 rounded-sm"
            >
              <input
                type="email"
                value={vipEmail}
                onChange={(e) => setVipEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-3 py-2 text-xs bg-transparent text-[#141413] placeholder:text-[var(--ink-muted)] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.16em] font-medium hover:bg-[#2B2B28] transition rounded-sm"
              >
                Join →
              </button>
            </form>
          )}

          <p className="text-[10px] text-[var(--ink-muted)] font-mono mt-3">
            No spam. Zero algorithmic noise. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[var(--ink-muted)]">
        <span>Lagos • Abuja • Port Harcourt • Worldwide Express</span>
        <span className="mt-2 sm:mt-0">Powered by Paystack &amp; Neon Postgres</span>
      </div>
    </footer>
  );
}
