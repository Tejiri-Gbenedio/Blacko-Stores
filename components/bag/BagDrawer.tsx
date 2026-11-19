"use client";

import React, { useState } from "react";
import { formatNaira } from "@/lib/currency";
import type { PackedBagItemDTO } from "@/lib/types";

interface BagDrawerProps {
  open: boolean;
  items: PackedBagItemDTO[];
  onClose: () => void;
  onRemoveItem: (id: string) => void;
}

export default function BagDrawer({
  open,
  items,
  onClose,
  onRemoveItem,
}: BagDrawerProps) {
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!open) return null;

  const totalKobo = items.reduce((sum, i) => sum + i.priceKobo * i.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          deliveryAddress: address,
          totalKobo,
          items: items.map((i) => ({
            title: i.title,
            size: i.size,
            priceKobo: i.priceKobo,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "Could not start Paystack checkout.");
        return;
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }

      setStatusMsg(data.message || "Order reference: " + data.reference);
    } catch {
      setStatusMsg("Network error connecting to checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#F9F8F6] border-l border-[#141413]/15 p-7 md:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                Blacko Stores • Custom Weekender
              </p>
              <h3 className="font-editorial text-3xl font-medium mt-0.5">
                Packed Garments
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-[0.16em] px-3 py-1.5 border border-[#141413]/20 hover:border-[#141413]"
            >
              Close
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-4 max-h-[38vh] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="text-xs text-[var(--ink-muted)] italic">
                Your Blacko Stores weekender bag is empty. Take a shirt off the rail and pack it inside.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-b border-[var(--hairline)] pb-3.5"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.foldedImgUrl}
                      alt={item.title}
                      className="w-14 h-12 object-contain bg-white border border-[#141413]/10 p-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#141413]">{item.title}</p>
                      <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                        Size {item.size} • {formatNaira(item.priceKobo)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)] hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleCheckout} className="border-t border-[var(--hairline)] pt-5 mt-5 space-y-3">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="uppercase tracking-[0.15em] text-xs text-[var(--ink-muted)]">
              Bag Total (NGN)
            </span>
            <span className="font-mono text-lg font-medium">
              {formatNaira(totalKobo)}
            </span>
          </div>

          <input
            type="email"
            required
            placeholder="Email for Paystack receipt"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#141413]/20 focus:outline-none focus:border-[#141413]"
          />
          <input
            type="text"
            required
            placeholder="Delivery address (Lagos, Abuja, PH, Nationwide)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#141413]/20 focus:outline-none focus:border-[#141413]"
          />

          {statusMsg && (
            <p className="text-[11px] font-mono text-[#141413] bg-[#ECE8DF] p-2.5">
              {statusMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full py-3.5 bg-[#141413] text-[#F9F8F6] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#2B2B28] disabled:opacity-40 transition"
          >
            {loading ? "Connecting Paystack..." : "Seal Bag & Pay with Paystack"}
          </button>
        </form>
      </div>
    </div>
  );
}
